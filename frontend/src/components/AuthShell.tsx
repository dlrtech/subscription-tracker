import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Centered card with the logo, shared by the sign-in, registration and password pages. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="glow grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-2xl font-extrabold">sub<span className="gradient-text">tracker</span></Link>
        {children}
      </div>
    </div>
  )
}

export const inputClass = 'w-full rounded-xl border border-line bg-ink px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-violet'
export const cardClass = 'space-y-4 rounded-3xl border border-line bg-panel p-6 shadow-2xl sm:p-8'
