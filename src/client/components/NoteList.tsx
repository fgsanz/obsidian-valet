import { useState } from 'react'
import { ArrowUp, ArrowDown, Check, XCircle, Minus, Copy } from 'lucide-react'
import type { ParsedNote, OperationResult } from '@shared/types'
import { RESULT_ORDER, type ResultStatus } from '../lib/resultOrder'
import Tooltip from './Tooltip'
import styles from './NoteList.module.css'

interface Props {
  notes: ParsedNote[]
  highlightProperties?: string[]
  result?: OperationResult | null
}

type SortColumn = 'name' | 'location' | 'props' | 'result'
type SortDirection = 'asc' | 'desc'

function renderPropValue(value: unknown): string {
  if (value == null) return '(empty)'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function NoteList({ notes, highlightProperties = [], result }: Props) {
  // Per-note result status, derived from which notes actually changed / errored.
  const changedSet = new Set(result?.changedPaths ?? [])
  const errorSet = new Set(result?.errors.map((e) => e.filePath) ?? [])
  function statusOf(filePath: string): ResultStatus {
    if (errorSet.has(filePath)) return 'failed'
    if (changedSet.has(filePath)) return 'success'
    return 'not-applied'
  }
  const hasNonSuccess = !!result && notes.some((n) => statusOf(n.filePath) !== 'success')

  // Default to sorting by result only when there is something other than a plain success to
  // surface (errors or unchanged notes); otherwise sort by location.
  const [sortColumn, setSortColumn] = useState<SortColumn>(hasNonSuccess ? 'result' : 'location')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // The same property can appear in several filter rules; show it only once per note.
  const uniqueProperties = [...new Set(highlightProperties)]

  if (notes.length === 0) {
    return <p className={styles.empty}>No notes matched the filter.</p>
  }

  function handleHeaderClick(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (sortColumn === 'result' && result) {
      // Custom sort order for result column: errors, then unchanged, then success.
      const cmp = RESULT_ORDER[statusOf(a.filePath)] - RESULT_ORDER[statusOf(b.filePath)]
      return sortDirection === 'asc' ? cmp : -cmp
    }

    let aVal: string
    let bVal: string

    if (sortColumn === 'name') {
      aVal = a.title.toLowerCase()
      bVal = b.title.toLowerCase()
    } else if (sortColumn === 'location') {
      const aDirname = a.relativePath.includes('/')
        ? a.relativePath.substring(0, a.relativePath.lastIndexOf('/'))
        : '(root)'
      const bDirname = b.relativePath.includes('/')
        ? b.relativePath.substring(0, b.relativePath.lastIndexOf('/'))
        : '(root)'
      aVal = aDirname.toLowerCase()
      bVal = bDirname.toLowerCase()
    } else {
      // Sort by property info: concatenate all highlighted properties
      const aPropStr = uniqueProperties
        .map((prop) => {
          const val = a.frontmatter[prop]
          return val == null ? '' : String(val)
        })
        .join(' ')
        .toLowerCase()
      const bPropStr = uniqueProperties
        .map((prop) => {
          const val = b.frontmatter[prop]
          return val == null ? '' : String(val)
        })
        .join(' ')
        .toLowerCase()
      aVal = aPropStr
      bVal = bPropStr
    }

    const cmp = aVal.localeCompare(bVal)
    return sortDirection === 'asc' ? cmp : -cmp
  })

  function getSortIndicator(column: SortColumn): React.ReactNode {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? <ArrowUp size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom' }} /> : <ArrowDown size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom' }} />
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={`${styles.colName} ${sortColumn === 'name' ? styles.sortActive : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleHeaderClick('name')}
            >
              Note name{getSortIndicator('name')}
            </th>
            <th
              className={`${styles.colLocation} ${sortColumn === 'location' ? styles.sortActive : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleHeaderClick('location')}
            >
              Location{getSortIndicator('location')}
            </th>
            <th
              className={`${styles.colProps} ${sortColumn === 'props' ? styles.sortActive : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleHeaderClick('props')}
            >
              Property info{getSortIndicator('props')}
            </th>
            {result && (
              <th
                className={`${styles.colResult} ${sortColumn === 'result' ? styles.sortActive : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleHeaderClick('result')}
              >
                Result{getSortIndicator('result')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedNotes.map((note) => {
            const dirname = note.relativePath.includes('/')
              ? note.relativePath.substring(0, note.relativePath.lastIndexOf('/'))
              : '(root)'

            const resultStatus = result ? statusOf(note.filePath) : null

            return (
              <tr key={note.filePath}>
                <td className={styles.colName}>
                  <span className={styles.noteName}>{note.title}</span>
                  <Tooltip content="Copy" className={styles.copyTooltip}>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      aria-label="Copy note name"
                      onClick={() => navigator.clipboard?.writeText(note.title)}
                    >
                      <Copy size={15} />
                    </button>
                  </Tooltip>
                </td>
                <td className={styles.colLocation}>{dirname}</td>
                <td className={styles.colProps}>
                  {uniqueProperties.length > 0 ? (
                    <div className={styles.propsList}>
                      {uniqueProperties.map((prop) => {
                        const val = note.frontmatter[prop]
                        if (val == null && !Object.hasOwn(note.frontmatter, prop)) return null
                        return (
                          <div key={prop} className={styles.propItem}>
                            <span className={styles.propKey}>{prop}</span>
                            <span className={styles.propSep}>:</span>
                            <span className={styles.propVal}>{renderPropValue(val)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className={styles.noProps}>—</span>
                  )}
                </td>
                {result && (
                  <td className={styles.colResult}>
                    {resultStatus === 'failed' && <XCircle size={18} color="var(--color-error)" />}
                    {resultStatus === 'success' && <Check size={18} color="var(--color-success)" />}
                    {resultStatus === 'not-applied' && (
                      <Tooltip content="Unchanged">
                        <Minus size={18} color="var(--color-text-subtle)" />
                      </Tooltip>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {result && result.errors.length > 0 && (
        <div className={styles.errors}>
          <div className={styles.errorsTitle}>
            {result.errors.length} {result.errors.length === 1 ? 'error' : 'errors'}
          </div>
          {result.errors.map((e) => (
            <div key={e.filePath} className={styles.errorItem}>
              {e.filePath}: {e.error}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
