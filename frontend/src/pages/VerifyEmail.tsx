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
        {state === 'working' && <p className="text-zinc-400">Doğrulanıyor…</p>}
        {state === 'ok' && (
          <>
            <p role="status" className="rounded-xl bg-lime/10 px-3 py-3 text-sm text-lime">E-postan doğrulandı ✅ Artık ödeme hatırlatmalarını alabilirsin.</p>
            <Link to={user ? '/app' : '/giris'} className="block w-full rounded-xl bg-lime py-3 text-center font-bold text-ink">
              {user ? 'Uygulamaya git' : 'Giriş yap'}
            </Link>
          </>
        )}
        {state === 'failed' && (
          <>
            <p role="alert" className="rounded-xl bg-pink/10 px-3 py-2 text-sm text-pink">
              Bu bağlantı geçersiz, süresi dolmuş ya da daha önce kullanılmış.
            </p>
            <p className="text-sm text-zinc-400">Giriş yapıp Profil sayfasından yeni bir doğrulama e-postası isteyebilirsin.</p>
            <Link to={user ? '/app/profil' : '/giris'} className="block w-full rounded-xl border border-line py-3 text-center font-semibold">
              {user ? 'Profile git' : 'Giriş yap'}
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
