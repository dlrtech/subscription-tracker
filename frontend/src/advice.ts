import { categoryLabels, money, type Category, type Subscription, type TotalSpending } from './api'
import type { Mood } from './components/Mascot'

export interface Advice {
  mood: Mood
  /** First line is the main remark; the rest are extra tips the user can page through. */
  lines: string[]
}

interface Input {
  total: TotalSpending | null
  activeCount: number
  upcoming: Subscription[]
  /** Monthly budget in the same currency as `total`, or null when the user has not set one. */
  budget: number | null
  today?: Date
}

const MANY_SUBSCRIPTIONS = 8
const DOMINANT_SHARE = 0.6

const daysUntil = (iso: string, today: Date) => {
  const d = new Date(iso + 'T00:00:00')
  const t = new Date(today); t.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

/** Turns the user's real numbers into a mood and a few short remarks for the mascot. */
export function adviceFor({ total, activeCount, upcoming, budget, today = new Date() }: Input): Advice {
  if (activeCount === 0) {
    return { mood: 'happy', lines: ['Merhaba, ben Pırıl! İlk aboneliğini ekle, harcamana göz kulak olayım.'] }
  }
  if (!total) return { mood: 'thinking', lines: ['Hesaplıyorum, bir saniye…'] }

  const monthly = total.monthlyTotal
  const cur = total.currency
  const cats = (Object.entries(total.monthlyByCategory) as [Category, number][]).sort((a, b) => b[1] - a[1])
  const top = cats[0]
  const topShare = monthly > 0 && top ? top[1] / monthly : 0

  let mood: Mood = 'happy'
  const lines: string[] = []

  if (budget && budget > 0) {
    const ratio = monthly / budget
    const pct = Math.round(ratio * 100)
    if (ratio > 1) {
      mood = 'shocked'
      lines.push(`Vay! Aylık bütçeni ${money(monthly - budget, cur)} aştın. İptal edebileceğin bir abonelik var mı?`)
    } else if (ratio >= 0.9) {
      mood = 'worried'
      lines.push(`Bütçenin %${pct}'ine geldin. Yeni bir abonelik eklemeden önce iki kez düşün.`)
    } else if (ratio >= 0.6) {
      mood = 'thinking'
      lines.push(`Bütçenin %${pct}'indesin. Dengeli gidiyorsun ama gözün üzerinde olsun.`)
    } else {
      lines.push(`Harika! Bütçenin sadece %${pct}'ini kullanıyorsun.`)
    }
  } else {
    if (activeCount >= MANY_SUBSCRIPTIONS) {
      mood = 'surprised'
      lines.push(`${activeCount} aktif aboneliğin var! Hepsini gerçekten kullanıyor musun?`)
    } else if (activeCount >= 3 && topShare >= DOMINANT_SHARE) {
      mood = 'surprised'
      lines.push(`Paranın %${Math.round(topShare * 100)}'si tek bir kategoriye gidiyor: ${categoryLabels[top[0]]}.`)
    } else {
      lines.push(`Ayda ${money(monthly, cur)} harcıyorsun. Gayet makul görünüyor.`)
    }
    lines.push('Aşağıdan bir aylık bütçe belirle, harcamana göre tepki vereyim.')
  }

  lines.push(`Bu hızla yılda ${money(total.yearlyTotal, cur)} ediyor.`)
  if (cats.length > 1 && topShare >= 0.5 && !lines[0].includes('kategoriye')) {
    lines.push(`En büyük pay ${categoryLabels[top[0]]} kategorisinde: %${Math.round(topShare * 100)}.`)
  }
  if (activeCount >= 6 && activeCount < MANY_SUBSCRIPTIONS) {
    lines.push(`${activeCount} aktif aboneliğin var. Kullanmadığın varsa durdurmayı düşün.`)
  }
  const soon = upcoming
    .map(u => ({ u, d: daysUntil(u.nextBillingDate, today) }))
    .filter(x => x.d === 0 || x.d === 1)
    .sort((a, b) => a.d - b.d)[0]
  if (soon) lines.push(`${soon.d === 0 ? 'Bugün' : 'Yarın'} ${soon.u.name} ödemesi var, hesabında yeterli bakiye olsun.`)

  return { mood, lines }
}
