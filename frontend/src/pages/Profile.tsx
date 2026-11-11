import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

const field = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-white outline-none focus:border-violet'

export default function Profile() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async (fn: () => Promise<void>, okText: string) => {
    try { await fn(); setMsg({ ok: true, text: okText }) }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
  }

  const saveName = (e: FormEvent) => { e.preventDefault(); run(async () => setUser(await api.updateName(name)), 'Adın güncellendi ✅') }
  const savePw = (e: FormEvent) => {
    e.preventDefault()
    run(async () => { await api.changePassword(cur, next); setCur(''); setNext('') }, 'Şifren değişti ✅')
  }
  const del = async () => {
    if (!confirm('Hesabın ve tüm aboneliklerin kalıcı olarak silinecek. Emin misin?')) return
    try { await api.deleteAccount(); signOut(); navigate('/') } catch (e) { setMsg({ ok: false, text: (e as Error).message }) }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-extrabold">Profil</h1>
      <p className="text-sm text-zinc-400">{user?.email}</p>
      {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? 'bg-lime/10 text-lime' : 'bg-pink/10 text-pink'}`}>{msg.text}</p>}

      <form onSubmit={saveName} className="space-y-3 rounded-3xl border border-line bg-panel p-5">
        <h2 className="font-bold">İsim</h2>
        <input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
        <button className="rounded-xl bg-white px-5 py-2.5 font-bold text-ink">Kaydet</button>
      </form>

      <form onSubmit={savePw} className="space-y-3 rounded-3xl border border-line bg-panel p-5">
        <h2 className="font-bold">Şifre değiştir</h2>
        <input className={field} type="password" placeholder="Mevcut şifre" value={cur} onChange={e => setCur(e.target.value)} required autoComplete="current-password" />
        <input className={field} type="password" placeholder="Yeni şifre (en az 8)" value={next} onChange={e => setNext(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
        <button className="rounded-xl bg-white px-5 py-2.5 font-bold text-ink">Güncelle</button>
      </form>

      <div className="rounded-3xl border border-pink/40 p-5">
        <h2 className="font-bold text-pink">Tehlikeli bölge</h2>
        <p className="mb-3 text-sm text-zinc-400">Hesabını silersen geri dönüş yok.</p>
        <button onClick={del} className="rounded-xl border border-pink px-5 py-2.5 font-bold text-pink hover:bg-pink hover:text-white">Hesabı sil</button>
      </div>
    </div>
  )
}
