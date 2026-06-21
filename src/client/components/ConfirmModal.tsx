import { useEffect, useState } from 'react'
import { matchesRequiredText } from '../lib/confirmText'
import styles from './ConfirmModal.module.css'

interface Props {
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** When set, the confirm button stays disabled until the user types this exact text. */
  requireText?: string
  /** Label shown above the type-to-confirm input (when `requireText` is set). */
  inputLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** A centered, theme-styled replacement for the browser's native confirm(). Optionally requires the
 *  user to type a specific word to enable the confirm button (for destructive, irreversible actions). */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  requireText,
  inputLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState('')
  const confirmEnabled = !requireText || matchesRequiredText(typed, requireText)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>{title}</div>
        <div className={styles.message}>{message}</div>

        {requireText && (
          <div className={styles.field}>
            {inputLabel && <label className={styles.fieldLabel}>{inputLabel}</label>}
            <input
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={!confirmEnabled}
            autoFocus={!requireText}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
