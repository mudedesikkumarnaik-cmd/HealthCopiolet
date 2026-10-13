import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthError, authService } from '@/services/authService'
import type { AuthSession, UserRole } from '@/types/user'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: {
    email: string
    password: string
    role: UserRole
    rememberMe?: boolean
  }) => Promise<AuthSession>
  signup: (input: {
    fullName: string
    email: string
    password: string
    role: UserRole
  }) => Promise<AuthSession>
  forgotPassword: (email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession())
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    setIsLoading(true)
    try {
      const next = await authService.login(input)
      setSession(next)
      return next
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback<AuthContextValue['signup']>(async (input) => {
    setIsLoading(true)
    try {
      const next = await authService.signup(input)
      setSession(next)
      return next
    } finally {
      setIsLoading(false)
    }
  }, [])

  const forgotPassword = useCallback<AuthContextValue['forgotPassword']>(async (email) => {
    await authService.forgotPassword(email)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setSession(null)
  }, [])

  // Keep multiple tabs in sync when one of them signs out.
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key?.endsWith(':session')) setSession(authService.getSession())
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      isLoading,
      login,
      signup,
      forgotPassword,
      logout,
    }),
    [session, isLoading, login, signup, forgotPassword, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

export { AuthError }