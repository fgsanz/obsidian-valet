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
      <div className={styles.list}>
        {notes.map((note) => (
          <div key={note.filePath} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.title}>{note.title}</span>
              <span className={styles.path}>{note.relativePath}</span>
            </div>
            {highlightProperties.length > 0 && (
              <div className={styles.props}>
                {highlightProperties.map((prop) => {
                  const val = note.frontmatter[prop]
                  if (val == null && !Object.hasOwn(note.frontmatter, prop)) return null
                  return (
                    <span key={prop} className={styles.prop}>
                      <span className={styles.propKey}>{prop}</span>
                      <span className={styles.propSep}>:</span>
                      <span className={styles.propVal}>{renderPropValue(val)}</span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

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
