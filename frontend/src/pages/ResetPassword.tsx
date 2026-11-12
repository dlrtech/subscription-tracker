import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import AuthShell, { cardClass, inputClass } from '../components/AuthShell'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== again) { setError('Şifreler aynı değil.'); return }
    setBusy(true); setError('')
    try { await api.resetPassword(token, password); setDone(true) }
    catch (err) {
      setError(err instanceof ApiError && err.status === 400 && !err.fields.newPassword
        ? 'Bu bağlantı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.'
        : (err as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className={cardClass}>
        <h1 className="text-2xl font-extrabold">Yeni şifre belirle 🔐</h1>
        {!token ? (
          <p role="alert" className="rounded-xl bg-pink/10 px-3 py-2 text-sm text-pink">
            Bağlantı eksik. E-postandaki bağlantıya tekrar tıkla ya da <Link className="underline" to="/sifremi-unuttum">yeni bir bağlantı iste</Link>.
          </p>
        ) : done ? (
          <>
            <p role="status" className="rounded-xl bg-lime/10 px-3 py-3 text-sm text-lime">Şifren değişti. Artık yeni şifrenle giriş yapabilirsin.</p>
            <Link to="/giris" className="block w-full rounded-xl bg-lime py-3 text-center font-bold text-ink">Giriş yap</Link>
          </>
        ) : (
          <>
            <input className={inputClass} type="password" placeholder="Yeni şifre (en az 8 karakter)" aria-label="Yeni şifre" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
            <input className={inputClass} type="password" placeholder="Yeni şifre (tekrar)" aria-label="Yeni şifre (tekrar)" value={again}
              onChange={e => setAgain(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
            {error && <p role="alert" className="rounded-xl bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-lime py-3 font-bold text-ink disabled:opacity-60">
              {busy ? 'Kaydediliyor…' : 'Şifreyi değiştir'}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  )
}
