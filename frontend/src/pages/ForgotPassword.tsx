import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import AuthShell, { cardClass, inputClass } from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await api.forgotPassword(email); setSent(true) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className={cardClass}>
        <h1 className="text-2xl font-extrabold">Şifreni mi unuttun? 🔑</h1>
        {sent ? (
          <p role="status" className="notice-ok text-sm">
            Bu adres kayıtlıysa şifre sıfırlama bağlantısını gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et. Bağlantı 1 saat geçerli.
          </p>
        ) : (
          <>
            <p className="text-sm muted">E-posta adresini yaz, sana şifreni sıfırlaman için bir bağlantı gönderelim.</p>
            <input className={inputClass} type="email" placeholder="E-posta" aria-label="E-posta" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            {error && <p role="alert" className="notice-error text-sm">{error}</p>}
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}
            </button>
          </>
        )}
        <p className="text-center text-sm muted"><Link className="font-semibold text-violet-deep underline" to="/giris">Girişe dön</Link></p>
      </form>
    </AuthShell>
  )
}
