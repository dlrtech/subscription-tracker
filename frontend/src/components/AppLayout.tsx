import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'

function VerifyBanner() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const resend = async () => {
    setState('sending')
    try { await api.resendVerification(); setState('sent') } catch { setState('failed') }
  }
  return (
    <div role="status" className="border-b border-line bg-lemon/70 px-4 py-2 text-center text-sm">
      {state === 'sent'
        ? 'Doğrulama e-postası gönderildi. Gelen kutunu kontrol et. ✉️'
        : <>
            E-postanı doğrula, ödeme hatırlatmalarını alabil. ✉️{' '}
            <button onClick={resend} disabled={state === 'sending'} className="font-extrabold underline disabled:opacity-60">
              {state === 'sending' ? 'Gönderiliyor…' : state === 'failed' ? 'Olmadı, tekrar dene' : 'Doğrulama e-postası gönder'}
            </button>
          </>}
    </div>
  )
}

const tabs = [
  { to: '/app', label: 'Özet', icon: '📊', end: true },
  { to: '/app/abonelikler', label: 'Abonelikler', icon: '🔁', end: false },
  { to: '/app/profil', label: 'Profil', icon: '🙂', end: false },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const out = () => { signOut(); navigate('/') }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/app" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet to-pink text-lg shadow-sm">💸</span>
            sub<span className="gradient-text">tracker</span>
          </NavLink>
          <nav className="hidden gap-1 md:flex">
            {tabs.map(t => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-ink text-white shadow' : 'muted hover:bg-violet/30 hover:text-ink'}`}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden muted sm:inline">Selam, {user?.name?.split(' ')[0]} 👋</span>
            <button onClick={out} className="btn btn-ghost !px-3 !py-1.5 text-sm">Çıkış</button>
          </div>
        </div>
      </header>

      {user && !user.emailVerified && <VerifyBanner />}

      <main className="mx-auto max-w-5xl px-4 py-6"><Outlet /></main>

      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-3 rounded-3xl border border-line bg-white/85 shadow-xl backdrop-blur-xl md:hidden">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-3xl py-2.5 text-xs font-bold transition ${isActive ? 'bg-violet/40 text-ink' : 'muted'}`}>
            <span className="text-lg">{t.icon}</span>{t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
