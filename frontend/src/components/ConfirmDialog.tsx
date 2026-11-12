import { useEffect, useRef } from 'react'

interface Props {
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Accessible replacement for window.confirm(): Escape cancels, focus starts on the safe button. */
export default function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg"
        onClick={e => e.stopPropagation()}
        className="card pop w-full max-w-sm space-y-3 p-6">
        <div aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-pink text-2xl">🗑️</div>
        <h2 id="confirm-title" className="text-lg font-extrabold">{title}</h2>
        <p id="confirm-msg" className="text-sm muted">{message}</p>
        <div className="flex gap-3 pt-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn btn-ghost flex-1">Vazgeç</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="btn btn-danger flex-1">
            {busy ? 'Bir saniye…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
