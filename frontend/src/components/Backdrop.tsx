import Icon, { type IconName } from './Icon'

// Fixed positions (not random) so the layout is stable between renders.
const scatter: { icon: IconName; pos: string; rot: number; size: string; hideOnSmall?: boolean }[] = [
  { icon: 'film', pos: 'left-[4%] top-[14%]', rot: -12, size: 'size-14' },
  { icon: 'headphones', pos: 'left-[90%] top-[10%]', rot: 10, size: 'size-14' },
  { icon: 'cloud', pos: 'left-[8%] top-[52%]', rot: 8, size: 'size-16' },
  { icon: 'gamepad', pos: 'left-[92%] top-[46%]', rot: -10, size: 'size-14' },
  { icon: 'play', pos: 'left-[6%] top-[86%]', rot: 12, size: 'size-12' },
  { icon: 'tv', pos: 'left-[88%] top-[84%]', rot: -8, size: 'size-14' },
  { icon: 'dumbbell', pos: 'left-[30%] top-[6%]', rot: 14, size: 'size-12', hideOnSmall: true },
  { icon: 'newspaper', pos: 'left-[70%] top-[93%]', rot: -6, size: 'size-12', hideOnSmall: true },
  { icon: 'laptop', pos: 'left-[48%] top-[96%]', rot: 6, size: 'size-14', hideOnSmall: true },
  { icon: 'book', pos: 'left-[76%] top-[4%]', rot: -14, size: 'size-12', hideOnSmall: true },
]

/**
 * Quiet page background: a faint dot grid, a few very soft color washes and subscription icons printed in
 * almost the same color as the page. Nothing moves, and cards are solid white so they stand out clearly.
 * Purely decorative.
 */
export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="blob -left-32 -top-32 size-[30rem] bg-violet" />
      <div className="blob -right-32 top-1/3 size-[28rem] bg-mint" />
      <div className="blob -bottom-40 left-1/4 size-[30rem] bg-sky" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgb(27 27 27 / 0.1) 1.2px, transparent 1.4px)', backgroundSize: '24px 24px' }} />
      {scatter.map((s, i) => (
        <span key={i} style={{ transform: `rotate(${s.rot}deg)` }} className={`absolute ${s.pos} ${s.hideOnSmall ? 'hidden md:block' : ''} text-ink/[0.07]`}>
          <Icon name={s.icon} className={s.size} />
        </span>
      ))}
    </div>
  )
}
