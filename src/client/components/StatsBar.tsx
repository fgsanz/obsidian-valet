import type { OperationResult } from '@shared/types'
import styles from './StatsBar.module.css'

interface Props {
  matched: number
  result?: OperationResult | null
}

export default function StatsBar({ matched, result }: Props) {
  return (
    <div className={styles.bar}>
      <span className={`${styles.stat} ${styles.matched}`}>
        <span className={styles.statValue}>{matched}</span>
        <span className={styles.statLabel}>{matched === 1 ? 'note' : 'notes'} matched</span>
      </span>
      {result && (
        <>
          <span className={styles.divider}>·</span>
          <span className={`${styles.stat} ${styles.succeeded}`}>
            <span className={styles.statValue}>{result.succeeded}</span>
            <span className={styles.statLabel}>changed</span>
          </span>
          <span className={styles.divider}>·</span>
          <span className={`${styles.stat} ${result.failed > 0 ? styles.failed : ''}`}>
            <span
              className={styles.statValue}
              style={
                result.failed === 0
                  ? { fontWeight: 'normal', color: 'var(--color-text-muted)' }
                  : { fontWeight: 700, color: 'var(--color-error)' }
              }
            >
              {result.failed}
            </span>
            <span className={styles.statLabel}>error{result.failed === 1 ? '' : 's'}</span>
          </span>
        </>
      )}
    </div>
  )
}
