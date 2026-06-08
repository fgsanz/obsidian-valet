import { useEffect, useState } from 'react'
import type { Operation, PropertyDef, PropertyType } from '@shared/types'
import Selector from './Selector'
import { getValuePlaceholder } from '../lib/operators'
import { resolvePropertyType } from '@shared/properties'
import styles from './BulkOpPanel.module.css'

interface Props {
  properties: PropertyDef[]
  suggestedProperty?: string
  onPreview: (op: Operation) => void
  onApply: (op: Operation) => void
  isPreviewing: boolean
  isApplying: boolean
  matchedNotes?: Array<{ frontmatter: Record<string, unknown> }>
  /** Disable the Apply button (e.g. a preview showed that no notes would change). */
  disableApply?: boolean
  /** The current operation has already been applied; disable Preview/Apply until it changes. */
  applied?: boolean
  /** Offer the optional "Commit changes" action (applied with no errors). */
  canCommit?: boolean
  /** Offer the optional "Revert changes" action (applied with errors). */
  canRevert?: boolean
  onCommitChanges?: () => void
  onRevertChanges?: () => void
  /** Called whenever the configured operation changes, so a stale preview can be cleared. */
  onOperationChange?: () => void
}

type OpType = 'delete-value' | 'replace' | 'move-value' | 'add-value'

function allowsMultipleValues(type: PropertyType): boolean {
  return type === 'text-array' || type === 'tag-array' || type === 'link-array'
}

export default function BulkOpPanel({
  properties,
  suggestedProperty = '',
  onPreview,
  onApply,
  isPreviewing,
  isApplying,
  matchedNotes = [],
  disableApply = false,
  applied = false,
  canCommit = false,
  canRevert = false,
  onCommitChanges,
  onRevertChanges,
  onOperationChange,
}: Props) {
  const [opType, setOpType] = useState<OpType>('delete-value')
  const [property, setProperty] = useState(suggestedProperty)
  const [value, setValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [fromProperty, setFromProperty] = useState(suggestedProperty)
  const [toProperty, setToProperty] = useState('')

  const propertyNames = properties.map((p) => p.name).sort((a, b) => a.localeCompare(b))

  const valuePlaceholder = (propName: string) =>
    getValuePlaceholder(resolvePropertyType(propName, properties))

  function getPropertyType(propName: string): PropertyType | undefined {
    return properties.find((p) => p.name === propName)?.type
  }

  function canApplyAddValue(): boolean {
    if (!property) return false
    const propType = getPropertyType(property)
    if (!propType) return false

    if (allowsMultipleValues(propType)) return true

    const someNotesHaveProperty = matchedNotes.some(
      (note) => note.frontmatter[property] != null
    )
    return !someNotesHaveProperty
  }

  function buildOperation(): Operation | null {
    if (opType === 'delete-value') {
      if (!property || !value) return null
      return { type: 'delete-value', property, value }
    }
    if (opType === 'replace') {
      if (!property || !value || !newValue) return null
      return { type: 'replace', property, oldValue: value, newValue }
    }
    if (opType === 'move-value') {
      if (!fromProperty || !toProperty || !value) return null
      return { type: 'move-value', fromProperty, toProperty, value }
    }
    if (opType === 'add-value') {
      if (!property || !value) return null
      if (!canApplyAddValue()) return null
      return { type: 'add-value', property, value }
    }
    return null
  }

  const op = buildOperation()

  // Notify the parent whenever the operation being configured changes, so a stale preview/result
  // (and the disabled state derived from it) can be cleared.
  const opSignature = JSON.stringify({ opType, property, value, newValue, fromProperty, toProperty })
  useEffect(() => {
    onOperationChange?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opSignature])

  return (
    <div className={styles.panel}>
      <div className={styles.typeRow}>
        {(['delete-value', 'replace', 'move-value', 'add-value'] as OpType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.typeBtn} ${opType === t ? styles.selected : ''}`}
            onClick={() => setOpType(t)}
          >
            {t === 'delete-value' ? 'Delete value' : t === 'replace' ? 'Replace value' : t === 'move-value' ? 'Move value' : 'Add value'}
          </button>
        ))}
      </div>

      <div className={styles.fields}>
        {opType === 'delete-value' && (
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Property</label>
              <Selector value={property} onChange={setProperty} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
            </div>
            <div className={styles.field}>
              <label>Value to delete</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder(property)} />
            </div>
          </div>
        )}

        {opType === 'replace' && (
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Property</label>
              <Selector value={property} onChange={setProperty} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
            </div>
            <div className={styles.field}>
              <label>Current value</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder(property)} />
            </div>
            <div className={styles.field}>
              <label>New value</label>
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={valuePlaceholder(property)} />
            </div>
          </div>
        )}

        {opType === 'move-value' && (
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>From property</label>
              <Selector value={fromProperty} onChange={setFromProperty} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
            </div>
            <div className={styles.field}>
              <label>To property</label>
              <Selector value={toProperty} onChange={setToProperty} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
            </div>
            <div className={styles.field}>
              <label>Value to move</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder(fromProperty)} />
            </div>
          </div>
        )}

        {opType === 'add-value' && (
          <>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Property</label>
                <Selector value={property} onChange={setProperty} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
              </div>
              <div className={styles.field}>
                <label>Value to add</label>
                <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder(property)} />
              </div>
            </div>
            {property && !allowsMultipleValues(getPropertyType(property) || 'text') && matchedNotes.some((n) => n.frontmatter[property] != null) && (
              <div className={styles.warning}>
                Some notes already have a value for this single-value property. They won't be affected by this operation.
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => op && onPreview(op)}
          disabled={!op || isPreviewing || isApplying || applied}
        >
          {isPreviewing ? 'Previewing…' : 'Preview'}
        </button>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => op && onApply(op)}
          disabled={!op || isPreviewing || isApplying || disableApply || applied}
        >
          {isApplying ? 'Applying…' : 'Apply changes'}
        </button>

        {(canCommit || canRevert) && (
          <div className={styles.optional}>
            <span className={styles.optionalLabel}>Optional →</span>
            {canCommit && (
              <button type="button" className={styles.optionalBtn} onClick={onCommitChanges}>
                Commit changes
              </button>
            )}
            {canRevert && (
              <button type="button" className={styles.optionalBtn} onClick={onRevertChanges}>
                Revert changes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
