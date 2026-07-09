import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

const storedSession = (() => {
  try {
    return JSON.parse(localStorage.getItem('electriIncomSession')) || null
  } catch {
    return null
  }
})()

function AuthProvider({ children }) {
  const [session, setSession] = useState(storedSession)

  const login = useCallback(async (credentials) => {
    const nextSession = await api.auth.login(credentials)
    localStorage.setItem('electriIncomSession', JSON.stringify(nextSession))
    setSession(nextSession)

    try {
      const cashSession = await api.cashClose.open({
        startNewSession: true,
        openingCash: 55,
        countedCash: 0,
        openedAt: new Date().toISOString(),
        user: nextSession.user?.name || nextSession.user?.email || 'Tecnico',
      })
      // Mark as fresh only when a new active jornada was really opened.
      if (!cashSession?.closedAt) {
        try {
          localStorage.setItem('electriIncomFreshSession', '1')
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('No se pudo iniciar la jornada:', error)
    }

    return nextSession
  }, [])

  const logout = useCallback(async () => {
    if (session?.token) {
      try {
        // Obtener el resumen actual para cerrar con datos correctos
        const today = await api.cashClose.getToday()
        await api.cashClose.close({
          openingCash: today.openingCash || 55,
          countedCash: today.countedCash || 0,
          closedAt: new Date().toISOString(),
          user: session.user?.name || session.user?.email || 'Tecnico',
        })
      } catch (error) {
        console.error('No se pudo cerrar la jornada:', error)
      }
    }

    localStorage.removeItem('electriIncomSession')
    setSession(null)
  }, [session])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
      token: session?.token || '',
      user: session?.user || null,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  return useContext(AuthContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth }
