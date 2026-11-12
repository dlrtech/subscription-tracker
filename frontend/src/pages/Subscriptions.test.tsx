import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Subscription } from '../api'
import Subscriptions from './Subscriptions'

vi.mock('../api', async importOriginal => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, api: { list: vi.fn(), update: vi.fn(), remove: vi.fn(), create: vi.fn() } }
})
import { api } from '../api'

const sub = (id: number, name: string, active = true): Subscription => ({
  id, name, price: 59.99, currency: 'TRY', billingPeriod: 'MONTHLY', category: 'MUSIC',
  nextBillingDate: '2099-01-01', active, monthlyCost: 59.99,
})

const list = vi.mocked(api.list)

beforeEach(() => {
  vi.resetAllMocks()
  list.mockResolvedValue({ items: [sub(1, 'Spotify'), sub(2, 'Netflix', false)], total: 2 })
})

describe('Subscriptions page', () => {
  it('shows the subscriptions and marks paused ones', async () => {
    render(<Subscriptions />)
    expect(await screen.findByText('Spotify')).toBeInTheDocument()
    expect(screen.getByText('(durduruldu)')).toBeInTheDocument()
    expect(screen.getByText('2 / 2 abonelik')).toBeInTheDocument()
  })

  it('searches on the server after the user stops typing', async () => {
    render(<Subscriptions />)
    await screen.findByText('Spotify')

    await userEvent.type(screen.getByLabelText('Abonelik ara'), 'net')

    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'net' })))
    // Debounced: typing three letters must not fire three requests.
    expect(list.mock.calls.filter(([query]) => query?.q !== undefined)).toHaveLength(1)
  })

  it('filters by status and changes the sort order', async () => {
    render(<Subscriptions />)
    await screen.findByText('Spotify')

    await userEvent.selectOptions(screen.getByLabelText('Duruma göre filtrele'), 'paused')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ active: false })))

    await userEvent.selectOptions(screen.getByLabelText('Sırala'), 'price-desc')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: 'price', order: 'desc' })))
  })

  it('pauses a subscription without opening the edit form', async () => {
    vi.mocked(api.update).mockResolvedValue(sub(1, 'Spotify', false))
    render(<Subscriptions />)

    await userEvent.click(await screen.findByLabelText('Spotify aboneliğini durdur'))

    expect(api.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Spotify', active: false }))
    expect(screen.queryByText('Aboneliği düzenle')).not.toBeInTheDocument()
  })

  it('asks for confirmation before deleting', async () => {
    vi.mocked(api.remove).mockResolvedValue(undefined)
    render(<Subscriptions />)

    await userEvent.click(await screen.findByLabelText('Spotify aboneliğini sil'))
    expect(api.remove).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('"Spotify" kalıcı olarak silinecek')

    await userEvent.click(screen.getByRole('button', { name: 'Sil' }))
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1))
  })

  it('keeps the subscription when the delete dialog is cancelled', async () => {
    render(<Subscriptions />)
    await userEvent.click(await screen.findByLabelText('Spotify aboneliğini sil'))
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(api.remove).not.toHaveBeenCalled()
  })

  it('loads the next page on demand', async () => {
    list.mockResolvedValueOnce({ items: [sub(1, 'Spotify')], total: 2 })
    list.mockResolvedValueOnce({ items: [sub(2, 'Netflix')], total: 2 })
    render(<Subscriptions />)
    await screen.findByText('Spotify')

    await userEvent.click(screen.getByRole('button', { name: 'Daha fazla göster' }))

    expect(await screen.findByText('Netflix')).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, size: 20 }))
    expect(screen.queryByRole('button', { name: 'Daha fazla göster' })).not.toBeInTheDocument()
  })

  it('offers a currency dropdown and shows server errors when saving fails', async () => {
    vi.mocked(api.create).mockRejectedValue(new Error('network down'))
    render(<Subscriptions />)
    await userEvent.click(await screen.findByRole('button', { name: '+ Ekle' }))

    expect(screen.getByLabelText('Para birimi').tagName).toBe('SELECT')
    await userEvent.type(screen.getByLabelText('Ad'), 'Disney+')
    await userEvent.type(screen.getByLabelText('Fiyat'), '99')
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Kaydedilemedi')
  })

  it('explains an empty search result', async () => {
    list.mockResolvedValue({ items: [], total: 0 })
    render(<Subscriptions />)
    await userEvent.type(await screen.findByLabelText('Abonelik ara'), 'zzz')
    expect(await screen.findByText('Aramana uyan abonelik yok.')).toBeInTheDocument()
  })
})
