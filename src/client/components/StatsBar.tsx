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
          {result.failed > 0 && (
            <>
              <span className={styles.divider}>·</span>
              <span className={`${styles.stat} ${styles.failed}`}>
                <span className={styles.statValue}>{result.failed}</span>
                <span className={styles.statLabel}>failed</span>
              </span>
            </>
          )}
        </>
      )}
    </div>
  )
}
