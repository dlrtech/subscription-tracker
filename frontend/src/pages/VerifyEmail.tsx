import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, tokenStore } from '../api'
import { useAuth } from '../auth'
import AuthShell, { cardClass } from '../components/AuthShell'

type State = 'working' | 'ok' | 'failed'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, setUser } = useAuth()
  const [state, setState] = useState<State>(token ? 'working' : 'failed')
  // The link works once; StrictMode runs effects twice in development, so guard the call.
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api.verifyEmail(token)
      .then(async () => {
        setState('ok')
        if (tokenStore.get()) setUser(await api.me())
      })
      .catch(() => setState('failed'))
  }, [token, setUser])

  return (
    <AuthShell>
      <div className={cardClass}>
        <h1 className="text-2xl font-extrabold">E-posta doğrulama</h1>
        {state === 'working' && <p className="muted">Doğrulanıyor…</p>}
        {state === 'ok' && (
          <>
            <p role="status" className="notice-ok text-sm">E-postan doğrulandı. Artık ödeme hatırlatmalarını alabilirsin.</p>
            <Link to={user ? '/app' : '/giris'} className="btn btn-primary w-full">
              {user ? 'Uygulamaya git' : 'Giriş yap'}
            </Link>
          </>
        )}
        {state === 'failed' && (
          <>
            <p role="alert" className="notice-error text-sm">
              Bu bağlantı geçersiz, süresi dolmuş ya da daha önce kullanılmış.
            </p>
            <p className="text-sm muted">Giriş yapıp Profil sayfasından yeni bir doğrulama e-postası isteyebilirsin.</p>
            <Link to={user ? '/app/profil' : '/giris'} className="btn btn-ghost w-full">
              {user ? 'Profile git' : 'Giriş yap'}
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
