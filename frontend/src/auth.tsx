import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, refreshSession, setUnauthorizedHandler, tokenStore, type AuthResponse, type User } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (r: AuthResponse) => void
  signOut: () => void
  setUser: (u: User) => void
}

const Ctx = createContext<AuthState | null>(null)

// Not a secret: it only remembers that this browser has signed in before, so first-time visitors
// do not trigger a pointless session-restore request.
const HINT = 'st_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(HINT))
  const navigate = useNavigate()

  const signOut = useCallback(() => {
    void api.logout()
    tokenStore.clear()
    localStorage.removeItem(HINT)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem(HINT)
      setUser(null)
      navigate('/giris', { replace: true })
    })
  }, [navigate])

  // Restore the session after a page load: the in-memory access token is gone, the refresh cookie is not.
  useEffect(() => {
    if (!localStorage.getItem(HINT)) return
    let cancelled = false
    refreshSession().then(r => {
      if (cancelled) return
      if (r) setUser(r.user)
      else localStorage.removeItem(HINT)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const signIn = useCallback((r: AuthResponse) => {
    tokenStore.set(r.accessToken)
    localStorage.setItem(HINT, '1')
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
