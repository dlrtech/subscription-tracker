import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, dayLabel, money, setUnauthorizedHandler, todayIso, tokenStore } from './api'

const jsonResponse = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers })

const authBody = { accessToken: 'fresh-token', tokenType: 'Bearer', expiresIn: 900, user: { id: 1 } }

describe('date and money helpers', () => {
  it('todayIso uses the local calendar date, not the UTC date', () => {
    // 00:30 local time on 5 Jan: in UTC+3 this is still 4 Jan in UTC, which toISOString() would report.
    expect(todayIso(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
    expect(todayIso(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('dayLabel names today, tomorrow and the next few days', () => {
    const now = new Date(2026, 5, 10, 15, 0)
    expect(dayLabel('2026-06-10', now)).toBe('Bugün')
    expect(dayLabel('2026-06-11', now)).toBe('Yarın')
    expect(dayLabel('2026-06-13', now)).toBe('3 gün sonra')
    expect(dayLabel('2026-07-20', now)).toContain('Temmuz')
  })

  it('money formats Turkish lira and survives unknown currency codes', () => {
    expect(money(1249.9, 'TRY')).toContain('1.249,90')
    expect(money(5, 'XX')).toBe('5.00 XX')
  })
})

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const unauthorized = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    setUnauthorizedHandler(unauthorized)
    tokenStore.set('old-token')
  })
  afterEach(() => {
    fetchMock.mockReset()
    unauthorized.mockReset()
    tokenStore.clear()
    vi.unstubAllGlobals()
  })

  const authHeader = (call: number) => {
    const headers = (fetchMock.mock.calls[call][1]?.headers ?? {}) as Record<string, string>
    return headers.Authorization
  }

  it('sends the bearer token and always includes cookies', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
    await api.me()
    expect(authHeader(0)).toBe('Bearer old-token')
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include')
  })

  it('renews an expired access token once and retries the request', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401))
      .mockResolvedValueOnce(jsonResponse(200, authBody))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))

    await expect(api.me()).resolves.toEqual({ id: 1 })

    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/auth/refresh')
    expect(authHeader(2)).toBe('Bearer fresh-token')
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('shares one refresh between concurrent requests', async () => {
    fetchMock.mockImplementation(async input => {
      const url = String(input)
      if (url.includes('/api/auth/refresh')) return jsonResponse(200, authBody)
      return jsonResponse(tokenStore.get() === 'fresh-token' ? 200 : 401, [])
    })

    await Promise.all([api.upcoming(), api.summary()])

    const refreshCalls = fetchMock.mock.calls.filter(c => String(c[0]).includes('/api/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })

  it('signs the user out when the refresh token is no longer valid', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401)).mockResolvedValueOnce(jsonResponse(401))

    await expect(api.me()).rejects.toMatchObject({ status: 401 })

    expect(unauthorized).toHaveBeenCalledOnce()
    expect(tokenStore.get()).toBeNull()
  })

  it('does not try to refresh failed logins', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { detail: 'Invalid email or password' }))
    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('turns rate limiting into a friendly message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(429, { detail: 'Too many requests' }))
    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow(/Çok fazla deneme/)
  })

  it('reports validation errors per field', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { detail: 'Validation failed', errors: { price: 'too low' } }))
    await expect(api.register({ name: '', email: '', password: '' }))
      .rejects.toMatchObject({ status: 400, fields: { price: 'too low' } })
  })

  it('list reads the total from the X-Total-Count header and builds the query string', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ id: 1 }], { 'X-Total-Count': '42' }))

    const result = await api.list({ q: 'spo', active: false, sort: 'name', order: 'asc', page: 1, size: 20 })

    expect(result.total).toBe(42)
    expect(result.items).toHaveLength(1)
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(Object.fromEntries(url.searchParams)).toEqual(
      { q: 'spo', active: 'false', sort: 'name', order: 'asc', page: '1', size: '20' })
  })

  it('maps a network failure to a readable error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(api.summary()).rejects.toMatchObject({ status: 0 })
  })
})
