import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

/** Centered card with the logo, shared by the sign-in, registration and password pages. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" aria-label="subtracker ana sayfa" className="pop mb-6 flex justify-center text-2xl"><Logo size="lg" /></Link>
        <div className="rise">{children}</div>
      </div>
    </div>
  )
}

export const inputClass = 'input'
export const cardClass = 'card space-y-4 p-6 sm:p-8'
