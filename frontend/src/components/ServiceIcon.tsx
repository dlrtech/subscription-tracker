import type { Category } from '../api'
import { iconFor } from '../icons'
import Icon from './Icon'

/** Rounded pastel app-icon tile for a subscription; wiggles when hovered. */
export default function ServiceIcon({ name, category, size = 'md' }: { name: string; category: Category; size?: 'md' | 'lg' }) {
  const { icon, bg } = iconFor(name, category)
  const box = size === 'lg' ? 'size-14 rounded-2xl' : 'size-11 rounded-2xl'
  return (
    <span aria-hidden="true" className={`${bg} ${box} grid shrink-0 place-items-center text-ink shadow-sm transition-transform hover:[animation:wiggle_0.5s_ease]`}>
      <Icon name={icon} className={size === 'lg' ? 'size-7' : 'size-6'} />
    </span>
  )
}
