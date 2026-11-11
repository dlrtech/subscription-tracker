import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, setUnauthorizedHandler, tokenStore, type AuthResponse, type User } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (r: AuthResponse) => void
  signOut: () => void
  setUser: (u: User) => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())
  const navigate = useNavigate()

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      navigate('/giris', { replace: true })
    })
  }, [navigate])

  useEffect(() => {
    if (!tokenStore.get()) return
    api.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((r: AuthResponse) => {
    tokenStore.set(r.accessToken)
    setUser(r.user)
  }, [])

  const value = useMemo(() => ({ user, loading, signIn, signOut, setUser }), [user, loading, signIn, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('AuthProvider eksik')
  return c
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center text-zinc-400">Yükleniyor…</div>
  if (!user) return <Navigate to="/giris" state={{ from: location.pathname }} replace />
  return <>{children}</>
}
