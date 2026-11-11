export type BillingPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type Category = 'ENTERTAINMENT' | 'MUSIC' | 'SOFTWARE' | 'INTERNET' | 'CLOUD' | 'OTHER'

export interface User { id: number; email: string; name: string; createdAt: string }
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

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'st_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
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

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dene.')
  }

  if (res.status === 401 && auth) {
    tokenStore.clear()
    onUnauthorized()
    throw new ApiError(401, 'Oturumun sona erdi, tekrar giriş yap.')
  }
  if (!res.ok) {
    let detail = 'Bir şeyler ters gitti.'
    let fields: Record<string, string> = {}
    try {
      const body = await res.json()
      detail = body.detail ?? body.message ?? detail
      fields = body.errors ?? {}
    } catch { /* gövde yok */ }
    throw new ApiError(res.status, detail, fields)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  register: (b: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: json(b) }, false),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: json(b) }, false),
  me: () => request<User>('/api/users/me'),
  updateName: (name: string) => request<User>('/api/users/me', { method: 'PUT', body: json({ name }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/api/users/me/password', { method: 'PUT', body: json({ currentPassword, newPassword }) }),
  deleteAccount: () => request<void>('/api/users/me', { method: 'DELETE' }),
  list: () => request<Subscription[]>('/api/subscriptions'),
  upcoming: (days = 14) => request<Subscription[]>(`/api/subscriptions/upcoming?days=${days}`),
  summary: () => request<SpendingSummary[]>('/api/subscriptions/summary'),
  create: (s: SubscriptionInput) => request<Subscription>('/api/subscriptions', { method: 'POST', body: json(s) }),
  update: (id: number, s: SubscriptionInput) =>
    request<Subscription>(`/api/subscriptions/${id}`, { method: 'PUT', body: json(s) }),
  remove: (id: number) => request<void>(`/api/subscriptions/${id}`, { method: 'DELETE' }),
}

export const money = (n: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)

export const dayLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff > 1 && diff < 8) return `${diff} gün sonra`
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}
