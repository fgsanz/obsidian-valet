import { useState } from 'react'
import type { Operation, PropertyDef } from '@shared/types'
import styles from './BulkOpPanel.module.css'

interface Props {
  properties: PropertyDef[]
  suggestedProperty?: string
  onPreview: (op: Operation) => void
  onApply: (op: Operation) => void
  isPreviewing: boolean
  isApplying: boolean
}

type OpType = 'delete-value' | 'replace' | 'move-value'

export default function BulkOpPanel({
  properties,
  suggestedProperty = '',
  onPreview,
  onApply,
  isPreviewing,
  isApplying,
}: Props) {
  const [opType, setOpType] = useState<OpType>('delete-value')
  const [property, setProperty] = useState(suggestedProperty)
  const [value, setValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [fromProperty, setFromProperty] = useState(suggestedProperty)
  const [toProperty, setToProperty] = useState('')

  const propList = properties.map((p) => p.name)
  const propListId = 'op-prop-list'

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
    return null
  }

  const op = buildOperation()

  return (
    <div className={styles.panel}>
      <datalist id={propListId}>
        {propList.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className={styles.typeRow}>
        {(['delete-value', 'replace', 'move-value'] as OpType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.typeBtn} ${opType === t ? styles.selected : ''}`}
            onClick={() => setOpType(t)}
          >
            {t === 'delete-value' ? 'Delete value' : t === 'replace' ? 'Replace value' : 'Move value'}
          </button>
        ))}
      </div>

      <div className={styles.fields}>
        {opType === 'delete-value' && (
          <>
            <div className={styles.field}>
              <label>Property</label>
              <input list={propListId} value={property} onChange={(e) => setProperty(e.target.value)} placeholder="parent" />
            </div>
            <div className={styles.field}>
              <label>Value to delete</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="[[Note Name]]" />
            </div>
          </>
        )}

        {opType === 'replace' && (
          <>
            <div className={styles.field}>
              <label>Property</label>
              <input list={propListId} value={property} onChange={(e) => setProperty(e.target.value)} placeholder="parent" />
            </div>
            <div className={styles.field}>
              <label>Current value</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="[[Old Note]]" />
            </div>
            <div className={styles.field}>
              <label>New value</label>
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="[[New Note]]" />
            </div>
          </>
        )}

        {opType === 'move-value' && (
          <>
            <div className={styles.field}>
              <label>From property</label>
              <input list={propListId} value={fromProperty} onChange={(e) => setFromProperty(e.target.value)} placeholder="parent" />
            </div>
            <div className={styles.field}>
              <label>To property</label>
              <input list={propListId} value={toProperty} onChange={(e) => setToProperty(e.target.value)} placeholder="related" />
            </div>
            <div className={styles.field}>
              <label>Value to move</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="[[Note Name]]" />
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => op && onPreview(op)}
          disabled={!op || isPreviewing || isApplying}
        >
          {isPreviewing ? 'Previewing…' : 'Preview'}
        </button>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => op && onApply(op)}
          disabled={!op || isPreviewing || isApplying}
        >
          {isApplying ? 'Applying…' : 'Apply to matched notes'}
        </button>
      </div>
    </div>
  )
}
