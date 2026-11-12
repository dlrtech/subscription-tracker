import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Centered card with the logo, shared by the sign-in, registration and password pages. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="pop mb-6 flex items-center justify-center gap-2 text-2xl font-extrabold">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet to-pink text-xl shadow-md">💸</span>
          <span>sub<span className="gradient-text">tracker</span></span>
        </Link>
        <div className="rise">{children}</div>
      </div>
    </div>
  )
}

export const inputClass = 'input'
export const cardClass = 'card space-y-4 p-6 sm:p-8'
