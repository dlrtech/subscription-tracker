import type { Category } from '../api'
import { iconFor } from '../icons'

/** Rounded pastel app-icon tile for a subscription; wiggles when hovered. */
export default function ServiceIcon({ name, category, size = 'md' }: { name: string; category: Category; size?: 'md' | 'lg' }) {
  const { emoji, bg } = iconFor(name, category)
  const box = size === 'lg' ? 'size-14 text-3xl rounded-2xl' : 'size-11 text-2xl rounded-2xl'
  return (
    <span aria-hidden="true" className={`${bg} ${box} grid shrink-0 place-items-center shadow-sm transition-transform hover:[animation:wiggle_0.5s_ease]`}>
      {emoji}
    </span>
  )
}
