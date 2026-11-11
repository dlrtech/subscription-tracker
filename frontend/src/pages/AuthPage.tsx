import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../auth'

const input = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-violet'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setFields({})
    try {
      const res = isRegister
        ? await api.register({ name, email, password })
        : await api.login({ email, password })
      signIn(res)
      navigate((location.state as { from?: string } | null)?.from ?? '/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields)
        setError(err.status === 401 ? 'E-posta ya da şifre yanlış.' : err.message)
      } else setError('Beklenmeyen bir hata oldu.')
    } finally { setBusy(false) }
  }

  return (
    <div className="glow grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-2xl font-extrabold">sub<span className="gradient-text">tracker</span></Link>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-panel p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-extrabold">{isRegister ? 'Hadi başlayalım 🚀' : 'Tekrar hoş geldin 👋'}</h1>
          <p className="text-sm text-zinc-400">{isRegister ? 'Dakikalar içinde abonelik kaosunu bitir.' : 'Aboneliklerin seni bekliyor.'}</p>

          {isRegister && (
            <div>
              <input className={input} placeholder="Adın" value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" />
              {fields.name && <p className="mt-1 text-xs text-pink">{fields.name}</p>}
            </div>
          )}
          <div>
            <input className={input} type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            {fields.email && <p className="mt-1 text-xs text-pink">{fields.email}</p>}
          </div>
          <div>
            <input className={input} type="password" placeholder={isRegister ? 'Şifre (en az 8 karakter)' : 'Şifre'} value={password}
              onChange={e => setPassword(e.target.value)} required minLength={isRegister ? 8 : 1} maxLength={72}
              autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {fields.password && <p className="mt-1 text-xs text-pink">{fields.password}</p>}
          </div>

          {error && <p role="alert" className="rounded-xl bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>}

          <button disabled={busy} className="w-full rounded-xl bg-lime py-3 font-bold text-ink transition hover:brightness-110 disabled:opacity-60">
            {busy ? 'Bir saniye…' : isRegister ? 'Hesap oluştur' : 'Giriş yap'}
          </button>
          <p className="text-center text-sm text-zinc-400">
            {isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
            <Link className="font-semibold text-white underline" to={isRegister ? '/giris' : '/kayit'}>{isRegister ? 'Giriş yap' : 'Kayıt ol'}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
