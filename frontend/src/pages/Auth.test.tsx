import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api'
import { AuthProvider } from '../auth'
import App from '../App'
import AuthPage from './AuthPage'
import ForgotPassword from './ForgotPassword'
import NotFound from './NotFound'
import ResetPassword from './ResetPassword'
import VerifyEmail from './VerifyEmail'

vi.mock('../api', async importOriginal => {
  const actual = await importOriginal<typeof import('../api')>()
  return {
    ...actual,
    refreshSession: vi.fn().mockResolvedValue(null),
    api: {
      login: vi.fn(), register: vi.fn(), logout: vi.fn().mockResolvedValue(undefined),
      forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn(), me: vi.fn(),
    },
  }
})
import { api } from '../api'

const user = { id: 1, email: 'a@b.com', name: 'Ada', emailVerified: false, remindersEnabled: true, reminderDays: 3, preferredCurrency: 'TRY', createdAt: '' }
const session = { accessToken: 't', tokenType: 'Bearer', expiresIn: 900, user }

const renderAt = (path: string, ui: React.ReactNode, routePath = path.split('?')[0]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={routePath} element={ui} />
          <Route path="/app" element={<p>uygulama</p>} />
          <Route path="/giris" element={<p>giriş sayfası</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )

beforeEach(() => { vi.clearAllMocks() })

describe('login', () => {
  it('signs in and opens the app', async () => {
    vi.mocked(api.login).mockResolvedValue(session)
    renderAt('/giris', <AuthPage mode="login" />)

    await userEvent.type(screen.getByLabelText('E-posta'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Şifre'), 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(await screen.findByText('uygulama')).toBeInTheDocument()
    expect(api.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret-pass' })
    expect(localStorage.getItem('st_session')).toBe('1')
  })

  it('shows a clear message for wrong credentials and links to password reset', async () => {
    vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    renderAt('/giris', <AuthPage mode="login" />)

    await userEvent.type(screen.getByLabelText('E-posta'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Şifre'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta ya da şifre yanlış.')
    expect(screen.getByRole('link', { name: 'Şifremi unuttum' })).toHaveAttribute('href', '/sifremi-unuttum')
  })

  it('tells the visitor the server is waking up when the request takes long', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.mocked(api.register).mockReturnValue(new Promise(() => {}))
      renderAt('/kayit', <AuthPage mode="register" />)
      await userEvent.type(screen.getByLabelText('Adın'), 'Ada')
      await userEvent.type(screen.getByLabelText('E-posta'), 'a@b.com')
      await userEvent.type(screen.getByLabelText('Şifre'), 'secret-pass')
      await userEvent.click(screen.getByRole('button', { name: 'Hesap oluştur' }))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()

      await act(async () => { await vi.advanceTimersByTimeAsync(4100) })
      expect(screen.getByRole('status')).toHaveTextContent('Sunucu uyanıyor')
    } finally { vi.useRealTimers() }
  })

  it('does not show the forgot-password link on the sign-up form', () => {
    renderAt('/kayit', <AuthPage mode="register" />)
    expect(screen.queryByRole('link', { name: 'Şifremi unuttum' })).not.toBeInTheDocument()
  })
})

describe('forgot password', () => {
  it('confirms without revealing whether the address exists', async () => {
    vi.mocked(api.forgotPassword).mockResolvedValue(undefined)
    renderAt('/sifremi-unuttum', <ForgotPassword />)

    await userEvent.type(screen.getByLabelText('E-posta'), 'someone@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Bağlantı gönder' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Bu adres kayıtlıysa')
    expect(api.forgotPassword).toHaveBeenCalledWith('someone@example.com')
  })
})

describe('reset password', () => {
  it('refuses mismatching passwords without calling the server', async () => {
    renderAt('/sifre-sifirla?token=abc', <ResetPassword />, '/sifre-sifirla')
    await userEvent.type(screen.getByLabelText('Yeni şifre'), 'brand-new-password')
    await userEvent.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'different-password')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Şifreler aynı değil')
    expect(api.resetPassword).not.toHaveBeenCalled()
  })

  it('sends the token from the link together with the new password', async () => {
    vi.mocked(api.resetPassword).mockResolvedValue(undefined)
    renderAt('/sifre-sifirla?token=abc', <ResetPassword />, '/sifre-sifirla')
    await userEvent.type(screen.getByLabelText('Yeni şifre'), 'brand-new-password')
    await userEvent.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'brand-new-password')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Şifren değişti')
    expect(api.resetPassword).toHaveBeenCalledWith('abc', 'brand-new-password')
  })

  it('explains an expired link', async () => {
    vi.mocked(api.resetPassword).mockRejectedValue(new ApiError(400, 'This link is invalid or has expired'))
    renderAt('/sifre-sifirla?token=old', <ResetPassword />, '/sifre-sifirla')
    await userEvent.type(screen.getByLabelText('Yeni şifre'), 'brand-new-password')
    await userEvent.type(screen.getByLabelText('Yeni şifre (tekrar)'), 'brand-new-password')
    await userEvent.click(screen.getByRole('button', { name: 'Şifreyi değiştir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('geçersiz ya da süresi dolmuş')
  })

  it('handles a link without a token', () => {
    renderAt('/sifre-sifirla', <ResetPassword />)
    expect(screen.getByRole('alert')).toHaveTextContent('Bağlantı eksik')
  })
})

describe('email verification', () => {
  it('verifies exactly once even though the effect runs twice in development', async () => {
    vi.mocked(api.verifyEmail).mockResolvedValue(undefined)
    renderAt('/dogrula?token=xyz', <VerifyEmail />, '/dogrula')

    expect(await screen.findByRole('status')).toHaveTextContent('E-postan doğrulandı')
    expect(api.verifyEmail).toHaveBeenCalledTimes(1)
    expect(api.verifyEmail).toHaveBeenCalledWith('xyz')
  })

  it('reports an invalid link', async () => {
    vi.mocked(api.verifyEmail).mockRejectedValue(new ApiError(400, 'invalid'))
    renderAt('/dogrula?token=bad', <VerifyEmail />, '/dogrula')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('geçersiz'))
  })
})

describe('routing', () => {
  it('shows a 404 page instead of the landing page for unknown addresses', () => {
    render(<MemoryRouter initialEntries={['/yok-boyle-bir-sayfa']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument()
  })

  it('serves the privacy page, including how to delete the account', () => {
    render(<MemoryRouter initialEntries={['/gizlilik']}><AuthProvider><App /></AuthProvider></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Gizlilik Metni' })).toBeInTheDocument()
    expect(screen.getByText(/Hesabı sil/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Verileri ne kadar süre saklıyoruz?' })).toBeInTheDocument()
  })

  it('links the privacy page from the sign-up form but not from the login form', () => {
    const { unmount } = renderAt('/kayit', <AuthPage mode="register" />)
    expect(screen.getByRole('link', { name: 'gizlilik metnini' })).toHaveAttribute('href', '/gizlilik')
    unmount()
    renderAt('/giris', <AuthPage mode="login" />)
    expect(screen.queryByRole('link', { name: 'gizlilik metnini' })).not.toBeInTheDocument()
  })

  it('NotFound links back home', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Ana sayfaya dön' })).toHaveAttribute('href', '/')
  })
})
