import { floatingIcons } from '../icons'
import Icon from './Icon'
import Mascot from './Mascot'

// Positions are fixed (not random) so the layout is stable between renders.
const spots = [
  'left-[3%] top-[12%]', 'left-[88%] top-[8%]', 'left-[10%] top-[48%]', 'left-[92%] top-[42%]',
  'left-[5%] top-[82%]', 'left-[85%] top-[80%]', 'left-[30%] top-[4%]', 'left-[66%] top-[90%]',
  'left-[48%] top-[94%]', 'left-[72%] top-[3%]', 'left-[20%] top-[92%]', 'left-[95%] top-[65%]',
]

/** Animated pastel background: drifting color blobs plus floating app icons. Purely decorative. */
export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="blob -left-24 -top-24 size-[28rem] bg-violet" />
      <div className="blob -right-28 top-1/4 size-[26rem] bg-pink [animation-delay:-7s]" />
      <div className="blob -bottom-32 left-1/4 size-[30rem] bg-sky [animation-delay:-13s]" />
      <div className="blob bottom-10 right-10 size-72 bg-mint [animation-delay:-4s]" />
      {/* Two little characters stroll along the bottom of the screen (large screens, and only with motion allowed). */}
      {([
        { color: 'mint', dur: '60s', delay: '-8s' },
        { color: 'pink', dur: '85s', delay: '-52s' },
      ] as const).map(w => (
        <div key={w.color} className="walker hidden md:block motion-reduce:hidden" style={{ animationDuration: w.dur, animationDelay: w.delay }}>
          <span className="floaty block" style={{ ['--dur' as string]: '0.7s', ['--amp' as string]: '6px', ['--r' as string]: '3deg' }}>
            <Mascot mood="happy" color={w.color} className="size-14 opacity-80" />
          </span>
        </div>
      ))}
      {floatingIcons.map((ic, i) => (
        <span
          key={i}
          style={{
            ['--r' as string]: `${(i % 2 ? 1 : -1) * (6 + (i % 4) * 3)}deg`,
            ['--dur' as string]: `${5 + (i % 5)}s`,
            ['--delay' as string]: `${-(i * 0.9)}s`,
            ['--amp' as string]: `${10 + (i % 3) * 6}px`,
          }}
          className={`floaty absolute ${spots[i]} ${ic.bg} grid size-12 place-items-center rounded-2xl text-ink opacity-70 shadow-md ${i > 5 ? 'hidden md:grid' : ''}`}
        >
          <Icon name={ic.icon} className="size-6" />
        </span>
      ))}
    </div>
  )
}
