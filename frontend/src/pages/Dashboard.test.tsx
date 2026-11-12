import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpendingSummary, TotalSpending, User } from '../api'
import Dashboard from './Dashboard'

vi.mock('../api', async importOriginal => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, api: { summary: vi.fn(), upcoming: vi.fn(), total: vi.fn(), updateProfile: vi.fn() } }
})
const authState = vi.hoisted(() => ({ user: null as unknown, setUser: vi.fn() }))
vi.mock('../auth', () => ({ useAuth: () => authState }))
import { api } from '../api'

const makeUser = (preferredCurrency: string): User => ({
  id: 1, email: 'a@b.com', name: 'Ada', emailVerified: true, remindersEnabled: true, reminderDays: 3, preferredCurrency, createdAt: '',
})
const summary = (currency: string, monthly: number): SpendingSummary => ({
  currency, activeSubscriptions: 1, monthlyTotal: monthly, yearlyTotal: monthly * 12, monthlyByCategory: { MUSIC: monthly },
})
const total = (over: Partial<TotalSpending> = {}): TotalSpending => ({
  currency: 'TRY', monthlyTotal: 500, yearlyTotal: 6000, monthlyByCategory: { MUSIC: 500 },
  unconvertedCurrencies: [], ratesDate: null, ...over,
})

const view = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

beforeEach(() => {
  vi.resetAllMocks()
  authState.user = makeUser('TRY')
  vi.mocked(api.upcoming).mockResolvedValue([])
  vi.mocked(api.total).mockResolvedValue(total())
})

describe('Dashboard', () => {
  it('offers a retry button when loading fails, and recovers', async () => {
    vi.mocked(api.summary).mockRejectedValueOnce(new Error('Sunucuya ulaşılamadı.'))
    vi.mocked(api.summary).mockResolvedValueOnce([summary('TRY', 100)])
    view()

    expect(await screen.findByRole('alert')).toHaveTextContent('Sunucuya ulaşılamadı.')
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))

    expect(await screen.findByText('Aylık harcadığın')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the total converted into the currency the user prefers', async () => {
    authState.user = makeUser('USD')
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('EUR', 10)])
    vi.mocked(api.total).mockResolvedValue(total({ currency: 'USD', monthlyTotal: 77, yearlyTotal: 924 }))
    view()

    await waitFor(() => expect(api.total).toHaveBeenCalledWith('USD'))
    expect(await screen.findByText(/77,00/)).toBeInTheDocument()
    expect(screen.getByLabelText('Toplam para birimi')).toHaveValue('USD')
  })

  it('converts even when every subscription uses one currency different from the preference', async () => {
    authState.user = makeUser('EUR')
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100)])
    view()
    await waitFor(() => expect(api.total).toHaveBeenCalledWith('EUR'))
  })

  it('saves a newly chosen currency as the user preference', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('USD', 10)])
    vi.mocked(api.updateProfile).mockResolvedValue(makeUser('EUR'))
    view()
    await screen.findByText('Aylık harcadığın')

    await userEvent.selectOptions(screen.getByLabelText('Toplam para birimi'), 'EUR')

    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ preferredCurrency: 'EUR' }))
    expect(authState.setUser).toHaveBeenCalledWith(expect.objectContaining({ preferredCurrency: 'EUR' }))
  })

  it('keeps the original amounts visible, grouped by the currency they were entered in', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('USD', 10)])
    view()
    expect(await screen.findByText('USD · aylık')).toBeInTheDocument()
    expect(screen.getByText('TRY · aylık')).toBeInTheDocument()
  })

  it('mentions currencies that could not be converted', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('XYZ', 5)])
    vi.mocked(api.total).mockResolvedValue(total({ unconvertedCurrencies: ['XYZ'], ratesDate: '2026-11-12' }))
    view()
    expect(await screen.findByText(/Çevrilemeyen para birimleri.*XYZ/)).toBeInTheDocument()
  })

  it('says so when exchange rates are unavailable', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('USD', 10)])
    vi.mocked(api.total).mockRejectedValue(new Error('down'))
    view()
    expect(await screen.findByText(/Kurlar şu an alınamadı/)).toBeInTheDocument()
  })

  it('shows the friendly empty state for new users', async () => {
    vi.mocked(api.summary).mockResolvedValue([])
    view()
    expect(await screen.findByText('Henüz hiç abonelik yok')).toBeInTheDocument()
    expect(screen.getByText(/ne kadar harcadığını gör/)).toBeInTheDocument()
  })
})
