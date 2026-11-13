export type Mood = 'happy' | 'surprised' | 'shocked' | 'worried' | 'thinking'
export type MascotColor = 'violet' | 'pink' | 'mint' | 'sky' | 'peach' | 'lemon'

interface Props {
  mood?: Mood
  color?: MascotColor
  /** Raises one arm and waves it. */
  waving?: boolean
  className?: string
}

const INK = '#2d2a4a'

/**
 * "Pırıl", the app's little blob character. Its face follows the mood; blinking, waving and shaking are CSS
 * animations (switched off automatically for people who prefer reduced motion). Decorative: the words that go
 * with it are always shown as real text next to it.
 */
export default function Mascot({ mood = 'happy', color = 'violet', waving = false, className = 'size-28' }: Props) {
  const fill = `var(--color-${color})`
  const wide = mood === 'surprised' || mood === 'shocked'
  const raised = wide || waving
  const eyeR = mood === 'shocked' ? 11 : wide ? 10 : 9
  const pupilR = mood === 'shocked' ? 3 : wide ? 3.5 : 4.5
  const look = mood === 'thinking' ? { x: 3, y: -3 } : mood === 'worried' ? { x: 0, y: 2 } : { x: 0, y: 1 }

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={`${className} ${mood === 'shocked' ? 'mascot-shake' : ''}`}>
      <ellipse cx="60" cy="113" rx="30" ry="5" fill={INK} opacity="0.08" />

      {/* arms */}
      {raised ? (
        <>
          <ellipse cx="13" cy="58" rx="7" ry="12" transform="rotate(-25 13 58)" fill={fill} stroke={INK} strokeWidth="3" />
          <g className={waving ? 'mascot-arm-wave' : undefined}>
            <ellipse cx="107" cy="58" rx="7" ry="12" transform="rotate(25 107 58)" fill={fill} stroke={INK} strokeWidth="3" />
          </g>
        </>
      ) : (
        <>
          <ellipse cx="12" cy="76" rx="7" ry="12" transform="rotate(12 12 76)" fill={fill} stroke={INK} strokeWidth="3" />
          <ellipse cx="108" cy="76" rx="7" ry="12" transform="rotate(-12 108 76)" fill={fill} stroke={INK} strokeWidth="3" />
        </>
      )}

      {/* feet */}
      <ellipse cx="44" cy="107" rx="12" ry="6" fill={fill} stroke={INK} strokeWidth="3" />
      <ellipse cx="76" cy="107" rx="12" ry="6" fill={fill} stroke={INK} strokeWidth="3" />

      {/* body */}
      <path d="M60 12c26 0 44 20 44 46 0 28-18 48-44 48S16 86 16 58C16 32 34 12 60 12Z" fill={fill} stroke={INK} strokeWidth="3" />
      <ellipse cx="42" cy="28" rx="10" ry="5" fill="#fff" opacity="0.45" transform="rotate(-25 42 28)" />

      {/* cheeks */}
      <circle cx="33" cy="70" r="6" fill="#ff8fb8" opacity={mood === 'worried' ? 0.25 : 0.55} />
      <circle cx="87" cy="70" r="6" fill="#ff8fb8" opacity={mood === 'worried' ? 0.25 : 0.55} />

      {/* eyebrows */}
      {wide && (
        <>
          <path d="M33 38q10-8 20 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M67 38q10-8 20 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {mood === 'worried' && (
        <>
          <path d="M34 42l20-5" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M66 37l20 5" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* eyes */}
      <g className="mascot-eyes">
        <circle cx="44" cy="54" r={eyeR} fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx="76" cy="54" r={eyeR} fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx={44 + look.x} cy={54 + look.y} r={pupilR} fill={INK} />
        <circle cx={76 + look.x} cy={54 + look.y} r={pupilR} fill={INK} />
      </g>

      {/* mouth */}
      {mood === 'happy' && <path d="M46 72q14 14 28 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
      {mood === 'surprised' && <ellipse cx="60" cy="78" rx="6" ry="8" fill={INK} />}
      {mood === 'shocked' && (
        <>
          <ellipse cx="60" cy="80" rx="9" ry="12" fill={INK} />
          <ellipse cx="60" cy="86" rx="5" ry="4" fill="#ff8fb8" />
        </>
      )}
      {mood === 'worried' && <path d="M46 80q5-6 10 0t10 0t8 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}
      {mood === 'thinking' && <path d="M50 78h20" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />}

      {/* extras */}
      {mood === 'worried' && <path d="M100 26c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z" fill="var(--color-sky)" stroke={INK} strokeWidth="2.5" />}
      {wide && (
        <>
          <text x="94" y="30" fontSize="22" fontWeight="900" fill={INK}>!</text>
          <text x="18" y="30" fontSize="22" fontWeight="900" fill={INK}>!</text>
        </>
      )}
      {mood === 'thinking' && <text x="92" y="30" fontSize="24" fontWeight="900" fill={INK}>?</text>}
    </svg>
  )
}
