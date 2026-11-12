import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  api, categoryLabels, currencies, dayLabel, money,
  type Category, type SpendingSummary, type Subscription, type TotalSpending,
} from '../api'
import { useAuth } from '../auth'
import ServiceIcon from '../components/ServiceIcon'
import { iconFor } from '../icons'

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const target = user?.preferredCurrency ?? 'TRY'
  const [summary, setSummary] = useState<SpendingSummary[] | null>(null)
  const [upcoming, setUpcoming] = useState<Subscription[]>([])
  const [total, setTotal] = useState<TotalSpending | null>(null)
  const [totalFailed, setTotalFailed] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => { setError(''); setSummary(null); setAttempt(a => a + 1) }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.summary(), api.upcoming(14)])
      .then(([s, u]) => { if (!cancelled) { setSummary(s); setUpcoming(u) } })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [attempt])

  // Everything is converted into the user's preferred currency; subscriptions keep their own currency.
  useEffect(() => {
    let cancelled = false
    api.total(target)
      .then(t => { if (!cancelled) { setTotal(t); setTotalFailed(false) } })
      .catch(() => { if (!cancelled) setTotalFailed(true) })
    return () => { cancelled = true }
  }, [target, attempt])

  const choose = async (currency: string) => {
    setTotal(null); setTotalFailed(false)
    try { setUser(await api.updateProfile({ preferredCurrency: currency })) }
    catch { setTotalFailed(true) }
  }

  if (error) {
    return (
      <div role="alert" className="notice-error space-y-3 !p-5">
        <p>{error}</p>
        <button onClick={retry} className="btn btn-danger !py-2 text-sm">Tekrar dene</button>
      </div>
    )
  }
  if (!summary) return <p className="muted">Yükleniyor…</p>

  if (summary.length === 0 && upcoming.length === 0) {
    return (
      <div className="card pop p-10 text-center">
        <div className="floaty text-6xl">🫥</div>
        <h2 className="mt-3 text-xl font-extrabold">Henüz hiç abonelik yok</h2>
        <p className="mt-1 muted">İlk aboneliğini ekle, her ay ne kadar harcadığını gör.</p>
        <Link to="/app/abonelikler" className="btn btn-primary mt-5">İlk aboneliği ekle</Link>
      </div>
    )
  }

  const activeCount = summary.reduce((n, s) => n + s.activeSubscriptions, 0)
  const options = [...new Set<string>([target, ...currencies, ...summary.map(s => s.currency)])]
  const cats = total ? (Object.entries(total.monthlyByCategory) as [Category, number][]).sort((a, b) => b[1] - a[1]) : []
  const max = Math.max(...cats.map(([, v]) => v), 1)

  return (
    <div className="space-y-6">
      <section className="rise overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet via-pink to-peach p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-extrabold">Aylık harcadığın</p>
          <label className="flex items-center gap-2 text-sm font-bold">
            <span className="hidden sm:inline">Toplamı şu birimde göster:</span>
            <select aria-label="Toplam para birimi" value={target} onChange={e => void choose(e.target.value)}
              className="rounded-full border-0 bg-white/80 px-3 py-1.5 font-extrabold shadow-sm outline-none focus:ring-4 focus:ring-white/60">
              {options.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        {totalFailed ? (
          <p className="mt-4 text-sm font-semibold">Kurlar şu an alınamadı, toplam çevrilemiyor. Aşağıda para birimlerini girdiğin gibi görebilirsin.</p>
        ) : !total ? (
          <p className="mt-4 text-sm font-semibold">Hesaplanıyor…</p>
        ) : (
          <>
            <div className="mt-2 grid items-end gap-4 sm:grid-cols-[1fr_auto]">
              <p className="text-5xl font-black tracking-tight sm:text-6xl">{money(total.monthlyTotal, total.currency)}</p>
              <div className="flex gap-3 text-sm font-bold">
                <div className="rounded-2xl bg-white/70 px-4 py-2"><p className="text-xs opacity-70">Yıllık toplam</p><p className="text-lg font-extrabold">{money(total.yearlyTotal, total.currency)}</p></div>
                <div className="rounded-2xl bg-white/70 px-4 py-2"><p className="text-xs opacity-70">Aktif abonelik</p><p className="text-lg font-extrabold">{activeCount}</p></div>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold opacity-80">
              {total.ratesDate ? `Kurlar: ${new Date(total.ratesDate + 'T00:00:00').toLocaleDateString('tr-TR')} (Avrupa Merkez Bankası referans kurları). ` : ''}
              {total.unconvertedCurrencies.length > 0 && `Çevrilemeyen para birimleri toplama dahil değil: ${total.unconvertedCurrencies.join(', ')}.`}
            </p>
          </>
        )}
      </section>

      {cats.length > 0 && total && (
        <section className="card rise p-5" style={{ ['--d' as string]: '0.1s' }}>
          <h3 className="mb-4 font-extrabold">Para nereye gidiyor? ({total.currency})</h3>
          <ul className="space-y-3">
            {cats.map(([c, v], i) => (
              <li key={c}>
                <div className="mb-1 flex items-center justify-between text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className={`${iconFor('', c).bg} grid size-7 place-items-center rounded-lg text-base`}>{iconFor('', c).emoji}</span>
                    {categoryLabels[c].replace(/^\S+\s/, '')}
                  </span>
                  <span className="muted">{money(v, total.currency)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-line">
                  <div className="bar-grow h-full rounded-full bg-gradient-to-r from-violet to-pink"
                    style={{ width: `${(v / max) * 100}%`, ['--d' as string]: `${0.2 + i * 0.1}s` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="card rise group p-5" open={totalFailed} style={{ ['--d' as string]: '0.15s' }}>
        <summary className="cursor-pointer list-none font-extrabold">💱 Girdiğin para birimleriyle <span className="text-sm font-semibold muted">(çevrilmemiş)</span></summary>
        <div className="mt-4 space-y-3">
          {summary.map(s => (
            <div key={s.currency} className="grid grid-cols-3 gap-3 rounded-2xl bg-violet/15 p-3 text-sm">
              <div><p className="text-xs muted">{s.currency} · aylık</p><p className="font-extrabold">{money(s.monthlyTotal, s.currency)}</p></div>
              <div><p className="text-xs muted">Yıllık</p><p className="font-extrabold">{money(s.yearlyTotal, s.currency)}</p></div>
              <div><p className="text-xs muted">Aktif</p><p className="font-extrabold text-violet-deep">{s.activeSubscriptions}</p></div>
            </div>
          ))}
        </div>
      </details>

      <section className="rise" style={{ ['--d' as string]: '0.2s' }}>
        <h3 className="mb-3 text-lg font-extrabold">⏰ Yaklaşan ödemeler <span className="text-sm font-semibold muted">(14 gün)</span></h3>
        {upcoming.length === 0 ? (
          <p className="card p-4 muted">Önümüzdeki 14 günde ödeme yok. Rahat nefes 😮‍💨</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((u, i) => (
              <li key={u.id} className="card card-hover rise flex items-center justify-between gap-3 !rounded-2xl px-4 py-3" style={{ ['--d' as string]: `${0.25 + i * 0.05}s` }}>
                <div className="flex min-w-0 items-center gap-3">
                  <ServiceIcon name={u.name} category={u.category} />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{u.name}</p>
                    <p className="text-xs muted">{categoryLabels[u.category]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold">{money(u.price, u.currency)}</p>
                  <p className="text-xs font-bold text-mint-deep">{dayLabel(u.nextBillingDate)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
