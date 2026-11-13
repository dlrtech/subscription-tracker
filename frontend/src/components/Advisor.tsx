import { useState, type FormEvent } from 'react'
import type { Advice } from '../advice'
import Mascot from './Mascot'

interface Props {
  advice: Advice
  currency: string
  budget: number | null
  onBudgetChange: (amount: number | null) => void
}

/** Pırıl talking about the user's spending. Tapping the character shows the next tip. */
export default function Advisor({ advice, currency, budget, onBudgetChange }: Props) {
  const [tip, setTip] = useState(0)
  const [draft, setDraft] = useState(budget ? String(budget) : '')
  const line = advice.lines[tip % advice.lines.length]

  const save = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(draft.replace(',', '.'))
    onBudgetChange(Number.isFinite(n) && n > 0 ? n : null)
    setTip(0)
  }
  const clear = () => { setDraft(''); onBudgetChange(null); setTip(0) }

  return (
    <section className="rise rounded-[1.75rem] bg-[#14284b] p-5 text-white shadow-lg" aria-label="Pırıl'ın yorumu" style={{ ['--d' as string]: '0.05s' }}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <button type="button" onClick={() => setTip(t => t + 1)} disabled={advice.lines.length < 2}
          aria-label="Pırıl'a dokun, başka bir ipucu göster" title="Dokun, başka bir ipucu söylesin"
          className="shrink-0 rounded-full outline-offset-4 disabled:cursor-default">
          {/* key restarts the hop animation on every tap and every mood change */}
          <span key={`${advice.mood}-${tip}`} className="mascot-hop block">
            <Mascot mood={advice.mood} waving={advice.mood === 'happy'} className="size-28" />
          </span>
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div key={`${advice.mood}-${tip}`} role="status" aria-live="polite" className="bubble bubble-in text-sm font-semibold text-ink sm:text-base">
            {line}
            {advice.lines.length > 1 && <span className="mt-1 block text-xs font-bold text-ink/70">İpucu {(tip % advice.lines.length) + 1} / {advice.lines.length}. Pırıl'a dokunarak diğerlerini gör.</span>}
          </div>
          <form onSubmit={save} className="flex flex-wrap items-end gap-2">
            <label className="min-w-40 flex-1 text-xs font-bold text-white/90">
              Aylık bütçen ({currency})
              <input className="input mt-1 !py-2 text-sm text-ink" type="number" inputMode="decimal" min="1" step="any"
                placeholder="Örn. 1500" value={draft} onChange={e => setDraft(e.target.value)} />
            </label>
            <button className="btn btn-accent !py-2 text-sm">Kaydet</button>
            {budget !== null && <button type="button" onClick={clear} className="btn btn-ghost !py-2 text-sm">Kaldır</button>}
          </form>
        </div>
      </div>
    </section>
  )
}
