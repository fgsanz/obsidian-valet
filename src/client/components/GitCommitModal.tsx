import { useState } from 'react'
import styles from './GitCommitModal.module.css'

interface Props {
  title: string
  description: string
  defaultMessage?: string
  commitLabel?: string
  /** Show the editable commit-message textarea (default true). */
  showMessage?: boolean
  /** Show the Cancel button (default true). */
  showCancel?: boolean
  onCommit: (message: string) => Promise<void>
  onSkip?: () => void
  onCancel: () => void
}

export default function GitCommitModal({
  title,
  description,
  defaultMessage = '',
  commitLabel = 'Commit',
  showMessage = true,
  showCancel = true,
  onCommit,
  onSkip,
  onCancel,
}: Props) {
  const [message, setMessage] = useState(defaultMessage)
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCommit() {
    setError(null)
    setIsCommitting(true)
    try {
      await onCommit(message.trim())
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('NOTHING_TO_COMMIT') || msg.includes('nothing to commit')) {
        onSkip?.()
      } else {
        setError(msg)
        setIsCommitting(false)
      }
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.title}>{title}</div>
        <p className={styles.desc}>{description}</p>

        {showMessage && (
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            autoFocus
          />
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {showCancel && (
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
          )}
          <div className={styles.actionsRight}>
            {onSkip && (
              <button type="button" className={styles.cancelBtn} onClick={onSkip}>
                Skip git commit
              </button>
            )}
            <button
              type="button"
              className={styles.commitBtn}
              onClick={handleCommit}
              disabled={(showMessage && !message.trim()) || isCommitting}
            >
              {isCommitting ? 'Working…' : commitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
