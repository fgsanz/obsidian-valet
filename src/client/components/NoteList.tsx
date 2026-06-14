import { useEffect, useRef, useState } from 'react'
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

  // Column definitions in render order, with default widths (as % of the table) that sum to 100.
  const columns: { key: SortColumn; label: string; className: string }[] = [
    { key: 'name', label: 'Note name', className: styles.colName },
    { key: 'location', label: 'Location', className: styles.colLocation },
    { key: 'props', label: 'Property info', className: styles.colProps },
    ...(result ? [{ key: 'result' as const, label: 'Result', className: styles.colResult }] : []),
  ]
  const defaultWidths = result ? [36, 16, 36, 12] : [42, 18, 40]

  const tableRef = useRef<HTMLTableElement>(null)
  const [activeHandle, setActiveHandle] = useState<number | null>(null)
  // Column widths (in %). Reset to defaults if the column set changes (Result column toggles).
  const [widths, setWidths] = useState<number[]>(defaultWidths)
  useEffect(() => {
    setWidths(result ? [36, 16, 36, 12] : [42, 18, 40])
  }, [result ? 4 : 3]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drag a divider: move width between column `index` and its right neighbour so their sum — and
  // therefore the whole table's width — stays constant. Each column keeps a small minimum.
  function startResize(e: React.MouseEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const tableWidth = tableRef.current?.offsetWidth ?? 1
    const start = [...widths]
    const MIN = 8
    setActiveHandle(index)

    function onMove(ev: MouseEvent) {
      const deltaPct = ((ev.clientX - startX) / tableWidth) * 100
      let left = start[index] + deltaPct
      let right = start[index + 1] - deltaPct
      if (left < MIN) {
        right -= MIN - left
        left = MIN
      }
      if (right < MIN) {
        left -= MIN - right
        right = MIN
      }
      setWidths((prev) => {
        const next = [...prev]
        next[index] = left
        next[index + 1] = right
        return next
      })
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setActiveHandle(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // The same property can appear in several filter rules; show it only once per note.
  const uniqueProperties = [...new Set(highlightProperties)]

  if (notes.length === 0) {
    return <p className={styles.empty}>No notes matched the filter.</p>
  }

  const colWidths = widths.length === columns.length ? widths : defaultWidths

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
      <table className={styles.table} ref={tableRef}>
        <colgroup>
          {columns.map((c, i) => (
            <col key={c.key} style={{ width: `${colWidths[i]}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.key}
                className={`${c.className} ${sortColumn === c.key ? styles.sortActive : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleHeaderClick(c.key)}
              >
                {c.label}
                {getSortIndicator(c.key)}
                {i < columns.length - 1 && (
                  <span
                    className={`${styles.resizeHandle} ${activeHandle === i ? styles.resizeHandleActive : ''}`}
                    onMouseDown={(e) => startResize(e, i)}
                    onClick={(e) => e.stopPropagation()}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${c.label} column`}
                  />
                )}
              </th>
            ))}
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
