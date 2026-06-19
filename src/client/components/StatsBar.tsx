import type { CSSProperties } from 'react'
import type { OperationResult } from '@shared/types'
import styles from './StatsBar.module.css'

interface Props {
  matched: number
  result?: OperationResult | null
  /** Preview mode: how many of the matched notes would change. */
  willChange?: number
}

/** Bold + coloured when non-zero; plain muted when zero. */
function valueStyle(value: number, activeColor: string): CSSProperties {
  return value === 0
    ? { fontWeight: 400, color: 'var(--color-text-muted)' }
    : { fontWeight: 700, color: activeColor }
}

export default function StatsBar({ matched, result, willChange }: Props) {
  const unchanged = result ? Math.max(matched - result.succeeded - result.failed, 0) : 0

  return (
    <div className={styles.bar}>
      <span className={styles.stat}>
        <span className={styles.statValue} style={valueStyle(matched, 'var(--color-text)')}>
          {matched}
        </span>
        <span className={styles.statLabel}>{matched === 1 ? 'note' : 'notes'} matched</span>
      </span>
      {!result && willChange !== undefined && (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.stat}>
            <span className={styles.statValue} style={valueStyle(willChange, 'var(--color-success)')}>
              {willChange}
            </span>
            <span className={styles.statLabel}>will change</span>
          </span>
        </>
      )}
      {result && (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.stat}>
            <span className={styles.statValue} style={valueStyle(result.succeeded, 'var(--color-success)')}>
              {result.succeeded}
            </span>
            <span className={styles.statLabel}>changed</span>
          </span>
          <span className={styles.divider}>·</span>
          <span className={styles.stat}>
            <span className={styles.statValue} style={valueStyle(unchanged, 'var(--color-text)')}>
              {unchanged}
            </span>
            <span className={styles.statLabel}>unchanged</span>
          </span>
          <span className={styles.divider}>·</span>
          <span className={styles.stat}>
            <span className={styles.statValue} style={valueStyle(result.failed, 'var(--color-error)')}>
              {result.failed}
            </span>
            <span className={styles.statLabel}>error{result.failed === 1 ? '' : 's'}</span>
          </span>
        </>
      )}
    </div>
  )
}
