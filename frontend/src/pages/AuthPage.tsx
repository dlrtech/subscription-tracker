import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../auth'
import AuthShell, { cardClass, inputClass as input } from '../components/AuthShell'
import Icon from '../components/Icon'

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
  const [slow, setSlow] = useState(false)

  // A sleeping free-tier server needs up to a minute or two to wake up: say so instead of leaving a silent spinner.
  useEffect(() => {
    if (!busy) return
    const t = setTimeout(() => setSlow(true), 4000)
    return () => { clearTimeout(t); setSlow(false) }
  }, [busy])

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
    <AuthShell>
      <form onSubmit={submit} className={cardClass}>
        <h1 className="text-2xl font-extrabold">{isRegister ? 'Hadi başlayalım' : 'Tekrar hoş geldin'}</h1>
        <p className="text-sm muted">{isRegister ? 'Dakikalar içinde abonelik kaosunu bitir.' : 'Aboneliklerin seni bekliyor.'}</p>

        {isRegister && (
          <div>
            <input className={input} placeholder="Adın" aria-label="Adın" value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" />
            {fields.name && <p className="mt-1 text-xs text-pink-deep">{fields.name}</p>}
          </div>
        )}
        <div>
          <input className={input} type="email" placeholder="E-posta" aria-label="E-posta" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          {fields.email && <p className="mt-1 text-xs text-pink-deep">{fields.email}</p>}
        </div>
        <div>
          <input className={input} type="password" placeholder={isRegister ? 'Şifre (en az 8 karakter)' : 'Şifre'} aria-label="Şifre" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={isRegister ? 8 : 1} maxLength={72}
            autoComplete={isRegister ? 'new-password' : 'current-password'} />
          {fields.password && <p className="mt-1 text-xs text-pink-deep">{fields.password}</p>}
          {!isRegister && <Link to="/sifremi-unuttum" className="mt-2 inline-block text-xs muted underline hover:text-ink">Şifremi unuttum</Link>}
        </div>

        {error && <p role="alert" className="notice-error text-sm">{error}</p>}
        {slow && (
          <p role="status" className="notice-ok flex items-start gap-2 text-sm">
            <Icon name="coffee" className="mt-0.5 size-4" />Sunucu uyanıyor, ilk istek 1-2 dakika sürebilir. Sayfayı kapatma, işlem kendiliğinden tamamlanacak.
          </p>
        )}

        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? 'Bir saniye…' : isRegister ? 'Hesap oluştur' : 'Giriş yap'}
        </button>
        {isRegister && (
          <p className="text-center text-xs muted">
            Hesap oluşturarak <Link to="/gizlilik" className="font-semibold underline">gizlilik metnini</Link> okuduğunu kabul edersin.
          </p>
        )}
        <p className="text-center text-sm muted">
          {isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
          <Link className="font-semibold text-violet-deep underline" to={isRegister ? '/giris' : '/kayit'}>{isRegister ? 'Giriş yap' : 'Kayıt ol'}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
