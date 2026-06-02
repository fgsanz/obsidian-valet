import { useState } from 'react'
import { ArrowUp, ArrowDown, Check, XCircle } from 'lucide-react'
import type { ParsedNote, OperationResult } from '@shared/types'
import { RESULT_ORDER, type ResultStatus, getResultStatus } from '../lib/resultOrder'
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
  const [sortColumn, setSortColumn] = useState<SortColumn>(result ? 'result' : 'location')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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
      // Custom sort order for result column
      const aFailed = result.errors.some((e) => e.filePath === a.filePath)
      const bFailed = result.errors.some((e) => e.filePath === b.filePath)
      const aSucceeded = result.errors.length === 0 || !aFailed
      const bSucceeded = result.errors.length === 0 || !bFailed

      const aStatus = getResultStatus(a.filePath, aSucceeded, aFailed)
      const bStatus = getResultStatus(b.filePath, bSucceeded, bFailed)

      const aOrder = RESULT_ORDER[aStatus]
      const bOrder = RESULT_ORDER[bStatus]

      const cmp = aOrder - bOrder
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
      const aPropStr = highlightProperties
        .map((prop) => {
          const val = a.frontmatter[prop]
          return val == null ? '' : String(val)
        })
        .join(' ')
        .toLowerCase()
      const bPropStr = highlightProperties
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

            const hasFailed = result?.errors.some((e) => e.filePath === note.filePath) ?? false
            const hasSucceeded = result && !hasFailed ? true : false
            const resultStatus = result
              ? hasFailed
                ? 'failed'
                : hasSucceeded
                  ? 'success'
                  : 'not-applied'
              : null

            return (
              <tr key={note.filePath}>
                <td className={styles.colName}>{note.title}</td>
                <td className={styles.colLocation}>{dirname}</td>
                <td className={styles.colProps}>
                  {highlightProperties.length > 0 ? (
                    <div className={styles.propsList}>
                      {highlightProperties.map((prop) => {
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
                    {resultStatus === 'not-applied' && <span className={styles.resultNA}>N/A</span>}
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
