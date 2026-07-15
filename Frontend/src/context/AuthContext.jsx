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

    return nextSession
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('electriIncomSession')
    setSession(null)
  }, [])

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
