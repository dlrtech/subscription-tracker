import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  api, ApiError, categoryLabels, dayLabel, money, periodLabels,
  type BillingPeriod, type Category, type Subscription, type SubscriptionInput,
} from '../api'

const field = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-white outline-none focus:border-violet'
const today = () => new Date().toISOString().slice(0, 10)
const empty = (): SubscriptionInput => ({
  name: '', price: 0, currency: 'TRY', billingPeriod: 'MONTHLY', category: 'ENTERTAINMENT', nextBillingDate: today(), active: true,
})

export default function Subscriptions() {
  const [items, setItems] = useState<Subscription[] | null>(null)
  const [editing, setEditing] = useState<{ id: number | null; data: SubscriptionInput } | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.list().then(setItems).catch(e => setError(e.message))
  }, [])
  useEffect(load, [load])

  const remove = async (s: Subscription) => {
    if (!confirm(`"${s.name}" silinsin mi?`)) return
    try { await api.remove(s.id); load() } catch (e) { setError((e as Error).message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Aboneliklerin</h1>
        <button onClick={() => setEditing({ id: null, data: empty() })} className="rounded-full bg-lime px-5 py-2.5 font-bold text-ink">+ Ekle</button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-pink/10 p-3 text-pink">{error}</p>}
      {!items ? <p className="text-zinc-400">Yükleniyor…</p> : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-zinc-400">Liste boş. İlk aboneliğini ekle 👆</p>
      ) : (
        <ul className="space-y-2">
          {items.map(s => (
            <li key={s.id} className={`flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3 ${s.active ? '' : 'opacity-50'}`}>
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.name} {!s.active && <span className="text-xs text-zinc-500">(durduruldu)</span>}</p>
                <p className="text-xs text-zinc-400">{categoryLabels[s.category]} · {periodLabels[s.billingPeriod]} · {dayLabel(s.nextBillingDate)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="font-bold">{money(s.price, s.currency)}</p>
                <button aria-label="Düzenle" onClick={() => setEditing({ id: s.id, data: { name: s.name, price: s.price, currency: s.currency, billingPeriod: s.billingPeriod, category: s.category, nextBillingDate: s.nextBillingDate, active: s.active } })} className="text-zinc-400 hover:text-white">✏️</button>
                <button aria-label="Sil" onClick={() => remove(s)} className="text-zinc-400 hover:text-pink">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <Editor state={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function Editor({ state, onClose, onSaved }: {
  state: { id: number | null; data: SubscriptionInput }; onClose: () => void; onSaved: () => void
}) {
  const [d, setD] = useState(state.data)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof SubscriptionInput>(k: K, v: SubscriptionInput[K]) => setD(p => ({ ...p, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setFields({})
    try {
      const body = { ...d, currency: d.currency.toUpperCase() }
      if (state.id === null) await api.create(body); else await api.update(state.id, body)
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields) }
    } finally { setBusy(false) }
  }

  const err = (k: string) => fields[k] && <p className="mt-1 text-xs text-pink">{fields[k]}</p>

  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-black/70 sm:place-items-center" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl border border-line bg-panel p-6 sm:rounded-3xl">
        <h2 className="text-xl font-extrabold">{state.id === null ? 'Yeni abonelik' : 'Aboneliği düzenle'}</h2>
        <div>
          <input className={field} placeholder="Ad (Netflix, Spotify…)" value={d.name} onChange={e => set('name', e.target.value)} required maxLength={100} />
          {err('name')}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input className={field} type="number" step="0.01" min="0.01" placeholder="Fiyat" value={d.price || ''} onChange={e => set('price', Number(e.target.value))} required />
            {err('price')}
          </div>
          <div>
            <input className={field} placeholder="TRY" maxLength={3} value={d.currency} onChange={e => set('currency', e.target.value)} required />
            {err('currency')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className={field} value={d.billingPeriod} onChange={e => set('billingPeriod', e.target.value as BillingPeriod)}>
            {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={field} value={d.category} onChange={e => set('category', e.target.value as Category)}>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Sonraki ödeme tarihi</label>
          <input className={field} type="date" value={d.nextBillingDate} onChange={e => set('nextBillingDate', e.target.value)} required />
          {err('nextBillingDate')}
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={d.active} onChange={e => set('active', e.target.checked)} className="size-4 accent-lime" /> Aktif
        </label>
        {error && <p role="alert" className="rounded-xl bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-line py-3 font-semibold">Vazgeç</button>
          <button disabled={busy} className="flex-1 rounded-xl bg-lime py-3 font-bold text-ink disabled:opacity-60">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
      </form>
    </div>
  )
}
