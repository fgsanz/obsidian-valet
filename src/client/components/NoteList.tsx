import type { ParsedNote, OperationResult } from '@shared/types'
import styles from './NoteList.module.css'

interface Props {
  notes: ParsedNote[]
  highlightProperties?: string[]
  result?: OperationResult | null
}

function renderPropValue(value: unknown): string {
  if (value == null) return '(empty)'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function NoteList({ notes, highlightProperties = [], result }: Props) {
  if (notes.length === 0) {
    return <p className={styles.empty}>No notes matched the filter.</p>
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colName}>Note name</th>
            <th className={styles.colLocation}>Location</th>
            <th className={styles.colProps}>Property info</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note) => {
            const dirname = note.relativePath.includes('/')
              ? note.relativePath.substring(0, note.relativePath.lastIndexOf('/'))
              : '(root)'

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
