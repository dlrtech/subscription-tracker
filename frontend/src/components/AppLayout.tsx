import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import Credit from './Credit'
import Icon, { type IconName } from './Icon'
import Logo from './Logo'

function VerifyBanner() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const resend = async () => {
    setState('sending')
    try { await api.resendVerification(); setState('sent') } catch { setState('failed') }
  }
  return (
    <div role="status" className="border-b border-line bg-lemon/70 px-4 py-2 text-center text-sm">
      {state === 'sent'
        ? 'Doğrulama e-postası gönderildi. Gelen kutunu kontrol et.'
        : <>
            <Icon name="mail" className="mr-1.5 inline size-4 align-[-3px]" />
            E-postanı doğrula, ödeme hatırlatmalarını alabil.{' '}
            <button onClick={resend} disabled={state === 'sending'} className="inline-flex min-h-11 items-center font-extrabold underline disabled:opacity-60">
              {state === 'sending' ? 'Gönderiliyor…' : state === 'failed' ? 'Olmadı, tekrar dene' : 'Doğrulama e-postası gönder'}
            </button>
          </>}
    </div>
  )
}

const tabs: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/app', label: 'Özet', icon: 'chart', end: true },
  { to: '/app/abonelikler', label: 'Abonelikler', icon: 'repeat', end: false },
  { to: '/app/profil', label: 'Profil', icon: 'user', end: false },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const out = () => { signOut(); navigate('/') }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/app" aria-label="subtracker ana sayfa" className="text-lg"><Logo /></NavLink>
          <nav aria-label="Ana menü" className="hidden gap-1 md:flex">
            {tabs.map(t => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${isActive ? 'bg-ink text-white shadow' : 'muted hover:bg-violet/30 hover:text-ink'}`}>
                <Icon name={t.icon} className="size-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden muted sm:inline">Selam, {user?.name?.split(' ')[0]}</span>
            <button onClick={out} className="btn btn-ghost min-h-11 !px-4 text-sm">Çıkış</button>
          </div>
        </div>
      </header>

      {user && !user.emailVerified && <VerifyBanner />}

      <main className="mx-auto max-w-5xl px-4 py-6"><Outlet /></main>
      <footer className="mx-auto max-w-5xl px-4 pb-6"><Credit /></footer>

      <nav aria-label="Alt menü" className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-3 rounded-3xl border-[1.5px] border-line bg-white shadow-xl md:hidden">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-3xl py-2 text-xs font-bold transition ${isActive ? 'bg-violet/40 text-ink' : 'muted'}`}>
            <Icon name={t.icon} className="size-5" />{t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
