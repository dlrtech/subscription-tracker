import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import ConfirmDialog from '../components/ConfirmDialog'

const field = 'input'

export default function Profile() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [remind, setRemind] = useState(user?.remindersEnabled ?? true)
  const [days, setDays] = useState(user?.reminderDays ?? 3)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const run = async (fn: () => Promise<void>, okText: string) => {
    try { await fn(); setMsg({ ok: true, text: okText }) }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
  }

  const saveName = (e: FormEvent) => { e.preventDefault(); run(async () => setUser(await api.updateProfile({ name })), 'Adın güncellendi ✅') }
  const saveReminders = (e: FormEvent) => {
    e.preventDefault()
    run(async () => setUser(await api.updateProfile({ remindersEnabled: remind, reminderDays: days })), 'Hatırlatma ayarların kaydedildi ✅')
  }
  const savePw = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { await api.changePassword(cur, next); setCur(''); setNext('') }, 'Şifren değişti, diğer cihazlardaki oturumların kapatıldı ✅')
  }
  const resend = () => run(() => api.resendVerification(), 'Doğrulama e-postası gönderildi. Gelen kutunu kontrol et.')
  const del = async () => {
    setDeleting(true)
    try { await api.deleteAccount(); signOut(); navigate('/') }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); setConfirmDelete(false) }
    finally { setDeleting(false) }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-extrabold">Profil</h1>
      <p className="text-sm muted">
        {user?.email}{' '}
        {user?.emailVerified
          ? <span className="font-bold text-mint-deep">✓ doğrulandı</span>
          : <button onClick={resend} className="ml-1 font-bold text-violet-deep underline">Doğrulama e-postasını tekrar gönder</button>}
      </p>
      {msg && <p role="status" className={`text-sm ${msg.ok ? 'notice-ok' : 'notice-error'}`}>{msg.text}</p>}

      <form onSubmit={saveName} className="card rise space-y-3 p-5">
        <h2 className="font-extrabold">İsim</h2>
        <input className={field} aria-label="İsim" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
        <button className="btn btn-dark">Kaydet</button>
      </form>

      <form onSubmit={saveReminders} className="card rise space-y-3 p-5">
        <h2 className="font-extrabold">⏰ Ödeme hatırlatmaları</h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)} className="size-4 accent-violet-deep" />
          Yaklaşan ödemeler için e-posta gönder
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Ödemeden
          <select className="input !w-auto !py-2 disabled:opacity-50" aria-label="Kaç gün önce" disabled={!remind}
            value={days} onChange={e => setDays(Number(e.target.value))}>
            {Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          gün önce
        </label>
        {!user?.emailVerified && <p className="text-xs muted">Hatırlatma almak için önce e-postanı doğrulaman gerekiyor.</p>}
        <button className="btn btn-dark">Kaydet</button>
      </form>

      <form onSubmit={savePw} className="card rise space-y-3 p-5">
        <h2 className="font-extrabold">Şifre değiştir</h2>
        <input className={field} type="password" placeholder="Mevcut şifre" aria-label="Mevcut şifre" value={cur} onChange={e => setCur(e.target.value)} required autoComplete="current-password" />
        <input className={field} type="password" placeholder="Yeni şifre (en az 8)" aria-label="Yeni şifre" value={next} onChange={e => setNext(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
        <button className="btn btn-dark">Güncelle</button>
      </form>

      <div className="card rise !border-pink-deep/40 p-5">
        <h2 className="font-extrabold text-pink-deep">Tehlikeli bölge</h2>
        <p className="mb-3 text-sm muted">Hesabını silersen geri dönüş yok.</p>
        <button onClick={() => setConfirmDelete(true)} className="btn btn-danger">Hesabı sil</button>
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Hesap silinsin mi?" message="Hesabın ve tüm aboneliklerin kalıcı olarak silinecek. Bu işlem geri alınamaz."
          confirmLabel="Hesabı sil" busy={deleting} onConfirm={del} onCancel={() => setConfirmDelete(false)} />
      )}
    </div>
  )
}
