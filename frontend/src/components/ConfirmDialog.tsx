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
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-3xl border border-line bg-panel p-6">
        <h2 id="confirm-title" className="text-lg font-extrabold">{title}</h2>
        <p id="confirm-msg" className="text-sm text-zinc-400">{message}</p>
        <div className="flex gap-3 pt-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className="flex-1 rounded-xl border border-line py-3 font-semibold">Vazgeç</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="flex-1 rounded-xl bg-pink py-3 font-bold text-white disabled:opacity-60">
            {busy ? 'Bir saniye…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
