import { createContext, useContext, useMemo, useState } from 'react'
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

  async function login(credentials) {
    const nextSession = await api.auth.login(credentials)
    localStorage.setItem('electriIncomSession', JSON.stringify(nextSession))
    setSession(nextSession)

    try {
      await api.cashClose.open({
        startNewSession: true,
        openingCash: 55,
        countedCash: 0,
        openedAt: new Date().toISOString(),
        user: nextSession.user?.name || nextSession.user?.email || 'Tecnico',
      })
      // Mark that a fresh session was started so UI can show zeros immediately
      try {
        localStorage.setItem('electriIncomFreshSession', '1')
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('No se pudo iniciar la jornada:', error)
    }

    return nextSession
  }

  async function logout() {
    if (session?.token) {
      try {
        await api.cashClose.close({
          openingCash: 55,
          countedCash: 0,
          closedAt: new Date().toISOString(),
          user: session.user?.name || session.user?.email || 'Tecnico',
        })
      } catch (error) {
        console.error('No se pudo cerrar la jornada:', error)
      }
    }

    localStorage.removeItem('electriIncomSession')
    setSession(null)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
      token: session?.token || '',
      user: session?.user || null,
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  return useContext(AuthContext)
}

export { AuthProvider, useAuth }
