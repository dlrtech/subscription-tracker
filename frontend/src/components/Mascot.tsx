export type Mood = 'happy' | 'surprised' | 'shocked' | 'worried' | 'thinking'
export type MascotColor = 'yellow' | 'sky' | 'mint'

interface Props {
  mood?: Mood
  /** Pırıl is yellow; the other colors are for "friends" shown next to it. */
  color?: MascotColor
  /** Raises one wing and waves it. */
  waving?: boolean
  className?: string
}

const INK = '#16263d'
const BEAK = '#ff9d1c'
const BODY: Record<MascotColor, string> = { yellow: '#ffd93b', sky: '#8cc8ff', mint: '#8fe3c0' }

/**
 * "Pırıl", the app's little canary chick: big round head, big eyes, orange beak and a feather tuft. Its face follows
 * the mood; blinking, waving and shaking are CSS animations (switched off for people who prefer reduced motion).
 * Decorative: whatever it "says" is always shown as real text next to it.
 */
export default function Mascot({ mood = 'happy', color = 'yellow', waving = false, className = 'size-28' }: Props) {
  const fill = BODY[color]
  const wide = mood === 'surprised' || mood === 'shocked'
  const raised = wide || waving
  const open = wide
  const irisR = mood === 'shocked' ? 4 : wide ? 5 : 6.5
  const look = mood === 'thinking' ? { x: 3, y: -4 } : mood === 'worried' ? { x: 0, y: 3 } : { x: 0, y: 1 }
  const mouthRx = mood === 'shocked' ? 8 : 6
  const mouthRy = mood === 'shocked' ? 8 : 5
  const mouthCy = mood === 'shocked' ? 75 : 73

  const line = { fill: 'none', stroke: INK, strokeWidth: 3, strokeLinecap: 'round' as const }

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={`${className} ${mood === 'shocked' ? 'mascot-shake' : ''}`}>
      <ellipse cx="60" cy="117" rx="30" ry="4" fill={INK} opacity="0.1" />

      {/* legs and feet */}
      <path d="M52 104v9M68 104v9M45 114h13M62 114h13" fill="none" stroke={BEAK} strokeWidth="3.5" strokeLinecap="round" />

      {/* wings */}
      {raised ? (
        <>
          <ellipse cx="19" cy="78" rx="8" ry="13" transform="rotate(-35 19 78)" fill={fill} stroke={INK} strokeWidth="3" />
          <g className={waving ? 'mascot-arm-wave' : undefined}>
            <ellipse cx="101" cy="78" rx="8" ry="13" transform="rotate(35 101 78)" fill={fill} stroke={INK} strokeWidth="3" />
          </g>
        </>
      ) : (
        <>
          <ellipse cx="35" cy="94" rx="8" ry="12" transform="rotate(20 35 94)" fill={fill} stroke={INK} strokeWidth="3" />
          <ellipse cx="85" cy="94" rx="8" ry="12" transform="rotate(-20 85 94)" fill={fill} stroke={INK} strokeWidth="3" />
        </>
      )}

      {/* body and head */}
      <ellipse cx="60" cy="93" rx="22" ry="14" fill={fill} stroke={INK} strokeWidth="3" />
      <circle cx="60" cy="50" r="38" fill={fill} stroke={INK} strokeWidth="3" />
      <ellipse cx="38" cy="26" rx="9" ry="4.5" fill="#fff" opacity="0.5" transform="rotate(-30 38 26)" />

      {/* feather tuft */}
      <path d="M56 13Q54 3 46 2M60 12Q61 1 68 0M64 13Q70 5 78 6" {...line} strokeWidth="3.5" />

      {/* cheeks */}
      <circle cx="28" cy="62" r="6" fill="#ff9d4d" opacity={mood === 'worried' ? 0.2 : 0.45} />
      <circle cx="92" cy="62" r="6" fill="#ff9d4d" opacity={mood === 'worried' ? 0.2 : 0.45} />

      {/* eyebrows */}
      {wide && (
        <>
          <path d="M34 24q13-9 26 0" {...line} />
          <path d="M60 24q13-9 26 0" {...line} />
        </>
      )}
      {mood === 'worried' && (
        <>
          <path d="M34 27l23-6" {...line} />
          <path d="M63 21l23 6" {...line} />
        </>
      )}

      {/* eyes */}
      <g className="mascot-eyes">
        <ellipse cx="47" cy="46" rx="12.5" ry="14" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <ellipse cx="73" cy="46" rx="12.5" ry="14" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx={47 + look.x} cy={46 + look.y} r={irisR} fill="#2f6bd8" />
        <circle cx={73 + look.x} cy={46 + look.y} r={irisR} fill="#2f6bd8" />
        <circle cx={47 + look.x} cy={46 + look.y} r={irisR * 0.5} fill={INK} />
        <circle cx={73 + look.x} cy={46 + look.y} r={irisR * 0.5} fill={INK} />
        <circle cx={44.5 + look.x} cy={43 + look.y} r="1.8" fill="#fff" />
        <circle cx={70.5 + look.x} cy={43 + look.y} r="1.8" fill="#fff" />
      </g>

      {/* beak */}
      {open ? (
        <>
          <ellipse cx="60" cy={mouthCy} rx={mouthRx} ry={mouthRy} fill="#7a2a12" />
          <ellipse cx="60" cy={mouthCy + mouthRy} rx={mouthRx + 4} ry="5" fill={BEAK} stroke={INK} strokeWidth="3" />
          <path d="M46 67Q60 57 74 67Q60 72 46 67Z" fill={BEAK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M46 66Q60 57 74 66Q74 73 60 75Q46 73 46 66Z" fill={BEAK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {mood === 'happy' && <path d="M50 69Q60 77 70 69" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />}
          {mood === 'worried' && <path d="M50 70q3.5-4 7 0t7 0t6 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />}
          {mood === 'thinking' && <path d="M52 70h16" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />}
        </>
      )}

      {/* extras */}
      {mood === 'worried' && <path d="M102 30c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z" fill="var(--color-sky)" stroke={INK} strokeWidth="2.5" />}
      {wide && (
        <>
          <text x="102" y="26" fontSize="22" fontWeight="900" fill={INK}>!</text>
          <text x="9" y="26" fontSize="22" fontWeight="900" fill={INK}>!</text>
        </>
      )}
      {mood === 'thinking' && <text x="98" y="28" fontSize="24" fontWeight="900" fill={INK}>?</text>}
    </svg>
  )
}
