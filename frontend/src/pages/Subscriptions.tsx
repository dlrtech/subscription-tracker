import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  api, ApiError, categoryLabels, currencies, dayLabel, money, periodLabels, todayIso,
  type BillingPeriod, type Category, type ListQuery, type Subscription, type SubscriptionInput,
} from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import ServiceIcon from '../components/ServiceIcon'

const field = 'input'
const small = 'input !py-2 text-sm'
const PAGE = 20

const empty = (): SubscriptionInput => ({
  name: '', price: 0, currency: 'TRY', billingPeriod: 'MONTHLY', category: 'ENTERTAINMENT', nextBillingDate: todayIso(), active: true,
})
const toInput = (s: Subscription): SubscriptionInput => ({
  name: s.name, price: s.price, currency: s.currency, billingPeriod: s.billingPeriod,
  category: s.category, nextBillingDate: s.nextBillingDate, active: s.active,
})

type StatusFilter = 'all' | 'active' | 'paused'
type SortKey = 'date-asc' | 'name-asc' | 'price-desc' | 'price-asc'

export default function Subscriptions() {
  const [items, setItems] = useState<Subscription[] | null>(null)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState<{ id: number | null; data: SubscriptionInput } | null>(null)
  const [deleting, setDeleting] = useState<Subscription | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('date-asc')
  const [loadingMore, setLoadingMore] = useState(false)
  const latest = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const query = useCallback((size: number, page = 0): ListQuery => {
    const [by, order] = sort.split('-') as ['date' | 'name' | 'price', 'asc' | 'desc']
    return {
      q: debounced || undefined,
      active: status === 'all' ? undefined : status === 'active',
      sort: by, order, page, size,
    }
  }, [debounced, status, sort])

  // Loads the first `count` rows again (used after changes, so already-loaded pages stay on screen).
  const reload = useCallback(async (count = PAGE) => {
    const id = ++latest.current
    try {
      const r = await api.list(query(Math.min(200, Math.max(PAGE, count))))
      if (id !== latest.current) return
      setItems(r.items); setTotal(r.total); setError('')
    } catch (e) {
      if (id === latest.current) setError((e as Error).message)
    }
  }, [query])

  useEffect(() => { void reload() }, [reload])

  const loadMore = async () => {
    if (!items) return
    setLoadingMore(true)
    const id = ++latest.current
    try {
      const r = await api.list(query(PAGE, Math.floor(items.length / PAGE)))
      if (id !== latest.current) return
      setItems(prev => [...(prev ?? []), ...r.items]); setTotal(r.total)
    } catch (e) { setError((e as Error).message) } finally { setLoadingMore(false) }
  }

  const toggleActive = async (s: Subscription) => {
    try { await api.update(s.id, { ...toInput(s), active: !s.active }); await reload(items?.length) }
    catch (e) { setError((e as Error).message) }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try { await api.remove(deleting.id); setDeleting(null); await reload(items?.length) }
    catch (e) { setError((e as Error).message); setDeleting(null) }
    finally { setDeleteBusy(false) }
  }

  const filtered = debounced !== '' || status !== 'all'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Aboneliklerin</h1>
        <button onClick={() => setEditing({ id: null, data: empty() })} className="btn btn-primary">+ Ekle</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" className={small} placeholder="Abonelik ara…" aria-label="Abonelik ara" value={search} onChange={e => setSearch(e.target.value)} maxLength={100} />
        <select className={small} aria-label="Duruma göre filtrele" value={status} onChange={e => setStatus(e.target.value as StatusFilter)}>
          <option value="all">Hepsi</option>
          <option value="active">Aktif</option>
          <option value="paused">Durdurulmuş</option>
        </select>
        <select className={small} aria-label="Sırala" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="date-asc">Ödeme tarihi</option>
          <option value="name-asc">İsim (A-Z)</option>
          <option value="price-desc">Fiyat (yüksek → düşük)</option>
          <option value="price-asc">Fiyat (düşük → yüksek)</option>
        </select>
      </div>

      {error && <p role="alert" className="notice-error">{error}</p>}
      {!items ? <p className="muted">Yükleniyor…</p> : items.length === 0 ? (
        <p className="card p-8 text-center muted">
          {filtered ? 'Aramana uyan abonelik yok.' : 'Liste boş. İlk aboneliğini yukarıdaki "Ekle" düğmesiyle ekle.'}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((s, i) => (
              <li key={s.id} className="card card-hover rise flex items-center justify-between gap-3 !rounded-2xl px-4 py-3" style={{ ['--d' as string]: `${Math.min(i, 10) * 0.04}s` }}>
                <div className={`flex min-w-0 items-center gap-3 ${s.active ? '' : 'opacity-50 grayscale'}`}>
                  <ServiceIcon name={s.name} category={s.category} />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{s.name} {!s.active && <span className="text-xs font-semibold muted">(durduruldu)</span>}</p>
                    <p className="text-xs muted">{categoryLabels[s.category]} · {periodLabels[s.billingPeriod]} · {dayLabel(s.nextBillingDate)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className={`font-extrabold ${s.active ? '' : 'opacity-50'}`}>{money(s.price, s.currency)}</p>
                  <button aria-label={s.active ? `${s.name} aboneliğini durdur` : `${s.name} aboneliğini sürdür`}
                    title={s.active ? 'Durdur' : 'Sürdür'} onClick={() => toggleActive(s)} className="icon-btn hover:bg-violet/30">
                    <Icon name={s.active ? 'pause' : 'play'} className="size-5" />
                  </button>
                  <button aria-label={`${s.name} aboneliğini düzenle`} title="Düzenle" onClick={() => setEditing({ id: s.id, data: toInput(s) })} className="icon-btn hover:bg-violet/30"><Icon name="pencil" className="size-5" /></button>
                  <button aria-label={`${s.name} aboneliğini sil`} title="Sil" onClick={() => setDeleting(s)} className="icon-btn text-pink-deep hover:bg-pink/40"><Icon name="trash" className="size-5" /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-sm muted">
            <span>{items.length} / {total} abonelik</span>
            {items.length < total && (
              <button onClick={loadMore} disabled={loadingMore} className="btn btn-ghost !py-2">
                {loadingMore ? 'Yükleniyor…' : 'Daha fazla göster'}
              </button>
            )}
          </div>
        </>
      )}

      {editing && <Editor state={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(items?.length) }} />}
      {deleting && (
        <ConfirmDialog title="Abonelik silinsin mi?" message={`"${deleting.name}" kalıcı olarak silinecek.`}
          confirmLabel="Sil" busy={deleteBusy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}
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
  const currencyOptions = currencies.includes(d.currency as typeof currencies[number]) ? currencies : [d.currency, ...currencies]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setFields({})
    try {
      if (state.id === null) await api.create(d); else await api.update(state.id, d)
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields) }
      else setError('Kaydedilemedi. Biraz sonra tekrar dene.')
    } finally { setBusy(false) }
  }

  const err = (k: string) => fields[k] && <p className="mt-1 text-xs text-pink-deep">{fields[k]}</p>

  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="card pop max-h-[92vh] w-full max-w-md space-y-3 overflow-y-auto !rounded-b-none bg-white p-6 sm:!rounded-3xl">
        <h2 className="text-xl font-extrabold">{state.id === null ? 'Yeni abonelik' : 'Aboneliği düzenle'}</h2>
        <div>
          <input className={field} placeholder="Ad (Netflix, Spotify…)" aria-label="Ad" value={d.name} onChange={e => set('name', e.target.value)} required maxLength={100} />
          {err('name')}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <input className={field} type="number" step="0.01" min="0.01" placeholder="Fiyat" aria-label="Fiyat" value={d.price || ''} onChange={e => set('price', Number(e.target.value))} required />
            {err('price')}
          </div>
          <div>
            <select className={field} aria-label="Para birimi" value={d.currency} onChange={e => set('currency', e.target.value)}>
              {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {err('currency')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className={field} aria-label="Ödeme periyodu" value={d.billingPeriod} onChange={e => set('billingPeriod', e.target.value as BillingPeriod)}>
            {Object.entries(periodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={field} aria-label="Kategori" value={d.category} onChange={e => set('category', e.target.value as Category)}>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="next-date" className="mb-1 block text-xs muted">Sonraki ödeme tarihi</label>
          <input id="next-date" className={field} type="date" value={d.nextBillingDate} onChange={e => set('nextBillingDate', e.target.value)} required />
          {err('nextBillingDate')}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={d.active} onChange={e => set('active', e.target.checked)} className="size-4 accent-violet-deep" /> Aktif
        </label>
        {error && <p role="alert" className="notice-error text-sm">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Vazgeç</button>
          <button disabled={busy} className="btn btn-primary flex-1">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
      </form>
    </div>
  )
}
