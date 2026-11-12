import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpendingSummary } from '../api'
import Dashboard from './Dashboard'

vi.mock('../api', async importOriginal => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, api: { summary: vi.fn(), upcoming: vi.fn(), total: vi.fn() } }
})
import { api } from '../api'

const summary = (currency: string, monthly: number): SpendingSummary => ({
  currency, activeSubscriptions: 1, monthlyTotal: monthly, yearlyTotal: monthly * 12, monthlyByCategory: { MUSIC: monthly },
})

const view = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.upcoming).mockResolvedValue([])
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

  it('does not show the combined total for a single currency', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100)])
    view()
    await screen.findByText('Aylık harcadığın')
    expect(screen.queryByText('Hepsi bir arada')).not.toBeInTheDocument()
    expect(api.total).not.toHaveBeenCalled()
  })

  it('shows one converted total when subscriptions use several currencies', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('USD', 10)])
    vi.mocked(api.total).mockResolvedValue({
      currency: 'TRY', monthlyTotal: 500, yearlyTotal: 6000, unconvertedCurrencies: ['XYZ'], ratesDate: '2026-11-12',
    })
    view()

    expect(await screen.findByText('Hepsi bir arada')).toBeInTheDocument()
    await waitFor(() => expect(api.total).toHaveBeenCalledWith('TRY'))
    expect(await screen.findByText(/500,00/)).toBeInTheDocument()
    expect(screen.getByText(/Çevrilemeyen para birimleri.*XYZ/)).toBeInTheDocument()
  })

  it('recalculates when another target currency is chosen', async () => {
    vi.mocked(api.summary).mockResolvedValue([summary('TRY', 100), summary('USD', 10)])
    vi.mocked(api.total).mockResolvedValue({
      currency: 'USD', monthlyTotal: 20, yearlyTotal: 240, unconvertedCurrencies: [], ratesDate: null,
    })
    view()
    await screen.findByText('Hepsi bir arada')

    await userEvent.selectOptions(screen.getByLabelText('Toplam para birimi'), 'USD')

    await waitFor(() => expect(api.total).toHaveBeenLastCalledWith('USD'))
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
