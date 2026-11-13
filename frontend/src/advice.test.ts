import { describe, expect, it } from 'vitest'
import { adviceFor } from './advice'
import type { Subscription, TotalSpending } from './api'

const total = (over: Partial<TotalSpending> = {}): TotalSpending => ({
  currency: 'TRY', monthlyTotal: 500, yearlyTotal: 6000,
  monthlyByCategory: { MUSIC: 250, ENTERTAINMENT: 250 }, unconvertedCurrencies: [], ratesDate: null, ...over,
})
const sub = (name: string, nextBillingDate: string): Subscription => ({
  id: 1, name, price: 10, currency: 'TRY', billingPeriod: 'MONTHLY', category: 'MUSIC', nextBillingDate, active: true, monthlyCost: 10,
})
const base = { total: total(), activeCount: 4, upcoming: [], budget: null as number | null, today: new Date(2026, 10, 13) }

describe('adviceFor', () => {
  it('welcomes a user without subscriptions', () => {
    const a = adviceFor({ ...base, activeCount: 0, total: null })
    expect(a.mood).toBe('happy')
    expect(a.lines[0]).toMatch(/İlk aboneliğini ekle/)
  })

  it('is happy and well below budget', () => {
    const a = adviceFor({ ...base, budget: 2000 })
    expect(a.mood).toBe('happy')
    expect(a.lines[0]).toMatch(/%25/)
  })

  it('thinks when around two thirds of the budget is used', () => {
    expect(adviceFor({ ...base, budget: 700 }).mood).toBe('thinking')
  })

  it('worries when close to the budget', () => {
    const a = adviceFor({ ...base, budget: 540 })
    expect(a.mood).toBe('worried')
    expect(a.lines[0]).toMatch(/%93/)
  })

  it('is shocked and names the overshoot when over budget', () => {
    const a = adviceFor({ ...base, budget: 300 })
    expect(a.mood).toBe('shocked')
    expect(a.lines[0]).toMatch(/aştın/)
    expect(a.lines[0]).toMatch(/200/)
  })

  it('is surprised by many subscriptions even without a budget', () => {
    const a = adviceFor({ ...base, activeCount: 9 })
    expect(a.mood).toBe('surprised')
    expect(a.lines[0]).toMatch(/9 aktif aboneliğin/)
  })

  it('is surprised when one category swallows most of the money', () => {
    const a = adviceFor({ ...base, total: total({ monthlyByCategory: { ENTERTAINMENT: 450, MUSIC: 50 } }) })
    expect(a.mood).toBe('surprised')
    expect(a.lines[0]).toMatch(/%90.*Eğlence/)
  })

  it('invites the user to set a budget when none is set', () => {
    expect(adviceFor(base).lines.join(' ')).toMatch(/bütçe belirle/)
  })

  it('does not nag about a budget that is already set', () => {
    expect(adviceFor({ ...base, budget: 2000 }).lines.join(' ')).not.toMatch(/bütçe belirle/)
  })

  it('reminds about a payment due tomorrow, but not one next week', () => {
    const soon = adviceFor({ ...base, upcoming: [sub('Spotify', '2026-11-14')] })
    expect(soon.lines.join(' ')).toMatch(/Yarın Spotify/)
    const later = adviceFor({ ...base, upcoming: [sub('Spotify', '2026-11-20')] })
    expect(later.lines.join(' ')).not.toMatch(/Spotify/)
  })

  it('stays calm while the total is still loading', () => {
    expect(adviceFor({ ...base, total: null }).mood).toBe('thinking')
  })
})
