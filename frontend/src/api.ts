export type BillingPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type Category = 'ENTERTAINMENT' | 'MUSIC' | 'SOFTWARE' | 'INTERNET' | 'CLOUD' | 'OTHER'

export interface User {
  id: number
  email: string
  name: string
  emailVerified: boolean
  remindersEnabled: boolean
  reminderDays: number
  createdAt: string
}
export interface AuthResponse { accessToken: string; tokenType: string; expiresIn: number; user: User }
export interface Subscription {
  id: number
  name: string
  price: number
  currency: string
  billingPeriod: BillingPeriod
  category: Category
  nextBillingDate: string
  active: boolean
  monthlyCost: number
}
export interface SubscriptionInput {
  name: string
  price: number
  currency: string
  billingPeriod: BillingPeriod
  category: Category
  nextBillingDate: string
  active: boolean
}
export interface SpendingSummary {
  currency: string
  activeSubscriptions: number
  monthlyTotal: number
  yearlyTotal: number
  monthlyByCategory: Partial<Record<Category, number>>
}
export interface TotalSpending {
  currency: string
  monthlyTotal: number
  yearlyTotal: number
  unconvertedCurrencies: string[]
  ratesDate: string | null
}
export interface ListQuery {
  q?: string
  active?: boolean
  sort?: 'date' | 'name' | 'price'
  order?: 'asc' | 'desc'
  page?: number
  size?: number
}
export interface ListResult { items: Subscription[]; total: number }

export const categoryLabels: Record<Category, string> = {
  ENTERTAINMENT: '🎬 Eğlence',
  MUSIC: '🎧 Müzik',
  SOFTWARE: '💻 Yazılım',
  INTERNET: '🌐 İnternet',
  CLOUD: '☁️ Bulut',
  OTHER: '✨ Diğer',
}
export const periodLabels: Record<BillingPeriod, string> = {
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
  YEARLY: 'Yıllık',
}
/** Currencies offered in the form; the backend accepts any 3-letter code. */
export const currencies = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN'] as const

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

// The access token only lives in memory: a script injected into the page cannot find it in storage.
// The long-lived refresh token is an HttpOnly cookie the page cannot read at all.
let accessToken: string | null = null
export const tokenStore = {
  get: () => accessToken,
  set: (t: string) => { accessToken = t },
  clear: () => { accessToken = null },
}

export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

async function send(path: string, init: RequestInit, auth: boolean): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'subtracker' }
  if (init.body) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' })
  } catch {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dene.')
  }
}

// Concurrent callers (several requests failing at once, React StrictMode) share one refresh call,
// because each refresh token can only be used once.
let refreshing: Promise<AuthResponse | null> | null = null
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const res = await send('/api/auth/refresh', { method: 'POST' }, false)
      if (!res.ok) return null
      const body = (await res.json()) as AuthResponse
      accessToken = body.accessToken
      return body
    } catch {
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

async function toError(res: Response): Promise<ApiError> {
  let detail = 'Bir şeyler ters gitti.'
  let fields: Record<string, string> = {}
  if (res.status === 429) detail = 'Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.'
  try {
    const body = await res.json()
    if (res.status !== 429) detail = body.detail ?? body.message ?? detail
    fields = body.errors ?? {}
  } catch { /* gövde yok */ }
  return new ApiError(res.status, detail, fields)
}

async function requestRaw(path: string, init: RequestInit = {}, auth = true): Promise<Response> {
  let res = await send(path, init, auth)

  if (res.status === 401 && auth) {
    // The 15-minute access token expired: renew it silently and retry once.
    if (await refreshSession()) {
      res = await send(path, init, auth)
    }
    if (res.status === 401) {
      tokenStore.clear()
      onUnauthorized()
      throw new ApiError(401, 'Oturumun sona erdi, tekrar giriş yap.')
    }
  }
  if (!res.ok) throw await toError(res)
  return res
}

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const res = await requestRaw(path, init, auth)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  register: (b: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: json(b) }, false),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: json(b) }, false),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }, false).catch(() => undefined),
  forgotPassword: (email: string) =>
    request<void>('/api/auth/forgot-password', { method: 'POST', body: json({ email }) }, false),
  resetPassword: (token: string, newPassword: string) =>
    request<void>('/api/auth/reset-password', { method: 'POST', body: json({ token, newPassword }) }, false),
  verifyEmail: (token: string) =>
    request<void>('/api/auth/verify-email', { method: 'POST', body: json({ token }) }, false),
  resendVerification: () => request<void>('/api/users/me/resend-verification', { method: 'POST' }),
  me: () => request<User>('/api/users/me'),
  updateProfile: (p: { name?: string; remindersEnabled?: boolean; reminderDays?: number }) =>
    request<User>('/api/users/me', { method: 'PUT', body: json(p) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/api/users/me/password', { method: 'PUT', body: json({ currentPassword, newPassword }) }),
  deleteAccount: () => request<void>('/api/users/me', { method: 'DELETE' }),
  list: async (query: ListQuery = {}): Promise<ListResult> => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params.set(k, String(v))
    const res = await requestRaw(`/api/subscriptions?${params}`)
    const items = (await res.json()) as Subscription[]
    return { items, total: Number(res.headers.get('X-Total-Count') ?? items.length) }
  },
  upcoming: (days = 14) => request<Subscription[]>(`/api/subscriptions/upcoming?days=${days}`),
  summary: () => request<SpendingSummary[]>('/api/subscriptions/summary'),
  total: (currency: string) =>
    request<TotalSpending>(`/api/subscriptions/summary/total?currency=${encodeURIComponent(currency)}`),
  create: (s: SubscriptionInput) => request<Subscription>('/api/subscriptions', { method: 'POST', body: json(s) }),
  update: (id: number, s: SubscriptionInput) =>
    request<Subscription>(`/api/subscriptions/${id}`, { method: 'PUT', body: json(s) }),
  remove: (id: number) => request<void>(`/api/subscriptions/${id}`, { method: 'DELETE' }),
}

export const money = (n: number, currency: string) => {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

/** Today's date as yyyy-mm-dd in the user's local time zone (toISOString would give the UTC date). */
export const todayIso = (now = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

export const dayLabel = (iso: string, now = new Date()) => {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff > 1 && diff < 8) return `${diff} gün sonra`
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}
