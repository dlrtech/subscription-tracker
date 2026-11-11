import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, categoryLabels, dayLabel, money, type Category, type SpendingSummary, type Subscription } from '../api'

export default function Dashboard() {
  const [summary, setSummary] = useState<SpendingSummary[] | null>(null)
  const [upcoming, setUpcoming] = useState<Subscription[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.summary(), api.upcoming(14)])
      .then(([s, u]) => { setSummary(s); setUpcoming(u) })
      .catch(e => setError(e.message))
  }, [])

  if (error) return <p className="rounded-xl bg-pink/10 p-4 text-pink">{error}</p>
  if (!summary) return <p className="text-zinc-400">Yükleniyor…</p>

  if (summary.length === 0 && upcoming.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-10 text-center">
        <div className="text-5xl">🫥</div>
        <h2 className="mt-3 text-xl font-bold">Henüz hiç abonelik yok</h2>
        <p className="mt-1 text-zinc-400">İlk aboneliğini ekle, her ay ne kadar yaktığını gör.</p>
        <Link to="/app/abonelikler" className="mt-5 inline-block rounded-full bg-lime px-6 py-3 font-bold text-ink">İlk aboneliği ekle</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {summary.map(s => {
        const cats = Object.entries(s.monthlyByCategory) as [Category, number][]
        const max = Math.max(...cats.map(([, v]) => v), 1)
        return (
          <section key={s.currency} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-gradient-to-br from-violet to-pink p-5">
                <p className="text-sm font-semibold text-white/80">Aylık yaktığın</p>
                <p className="mt-1 text-3xl font-extrabold">{money(s.monthlyTotal, s.currency)}</p>
              </div>
              <div className="rounded-3xl border border-line bg-panel p-5">
                <p className="text-sm text-zinc-400">Yıllık toplam</p>
                <p className="mt-1 text-3xl font-extrabold">{money(s.yearlyTotal, s.currency)}</p>
              </div>
              <div className="rounded-3xl border border-line bg-panel p-5">
                <p className="text-sm text-zinc-400">Aktif abonelik</p>
                <p className="mt-1 text-3xl font-extrabold text-lime">{s.activeSubscriptions}</p>
              </div>
            </div>

            {cats.length > 0 && (
              <div className="rounded-3xl border border-line bg-panel p-5">
                <h3 className="mb-4 font-bold">Para nereye gidiyor? ({s.currency})</h3>
                <ul className="space-y-3">
                  {cats.sort((a, b) => b[1] - a[1]).map(([c, v]) => (
                    <li key={c}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{categoryLabels[c]}</span><span className="text-zinc-400">{money(v, s.currency)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-ink">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet to-pink" style={{ width: `${(v / max) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )
      })}

      <section>
        <h3 className="mb-3 text-lg font-bold">⏰ Yaklaşan ödemeler <span className="text-sm font-normal text-zinc-500">(14 gün)</span></h3>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-line bg-panel p-4 text-zinc-400">Önümüzdeki 14 günde ödeme yok. Rahat nefes 😮‍💨</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map(u => (
              <li key={u.id} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-zinc-400">{categoryLabels[u.category]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{money(u.price, u.currency)}</p>
                  <p className="text-xs text-lime">{dayLabel(u.nextBillingDate)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
