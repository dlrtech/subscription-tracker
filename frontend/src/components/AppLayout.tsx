import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

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
      <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/app" className="text-lg font-extrabold tracking-tight">
            sub<span className="gradient-text">tracker</span>
          </NavLink>
          <nav className="hidden gap-1 md:flex">
            {tabs.map(t => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-white text-ink' : 'text-zinc-400 hover:text-white'}`}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-400 sm:inline">Selam, {user?.name?.split(' ')[0]} 👋</span>
            <button onClick={out} className="rounded-full border border-line px-3 py-1.5 text-zinc-300 hover:border-zinc-500">Çıkış</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6"><Outlet /></main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-panel/95 backdrop-blur md:hidden">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${isActive ? 'text-lime' : 'text-zinc-400'}`}>
            <span className="text-lg">{t.icon}</span>{t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
