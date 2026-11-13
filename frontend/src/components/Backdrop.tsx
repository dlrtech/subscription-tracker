/**
 * Calm page background: a few very faint, motionless color washes on a soft lavender-grey base.
 * Kept quiet on purpose so the white cards in front of it stand out clearly. Purely decorative.
 */
export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="blob -left-32 -top-32 size-[30rem] bg-violet" />
      <div className="blob -right-32 top-1/3 size-[28rem] bg-pink" />
      <div className="blob -bottom-40 left-1/4 size-[30rem] bg-sky" />
    </div>
  )
}
