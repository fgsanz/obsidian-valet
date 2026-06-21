import { useEffect, useRef, useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import type { Operation, PropertyDef, PropertyType } from '@shared/types'
import Selector from './Selector'
import ValueInput from './ValueInput'
import Tooltip from './Tooltip'
import { getValuePlaceholder, movableFromOptions, isMoveValid } from '../lib/operators'
import { makeRow, updateOpRow, removeOpRow, type OpRow, type OpType } from '../lib/opRows'
import { addValueStatus, canAddValue } from '../lib/addValue'
import { deleteValueStatus, canDeleteValue } from '../lib/deleteValue'
import { resolvePropertyType, isValidValueForType, expectedFormatHint } from '@shared/properties'
import styles from './BulkOpPanel.module.css'

interface Props {
  properties: PropertyDef[]
  /** Controlled operation draft (lifted to the page so it survives navigation). */
  opType: OpType
  rows: OpRow[]
  onOpTypeChange: (opType: OpType) => void
  onRowsChange: (rows: OpRow[]) => void
  onPreview: (ops: Operation[]) => void
  onApply: (ops: Operation[]) => void
  isPreviewing: boolean
  isApplying: boolean
  matchedNotes?: Array<{ frontmatter: Record<string, unknown> }>
  /** Disable both Preview and Apply (e.g. no notes are matched yet). */
  disabled?: boolean
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
  /** Called whenever the configured operations change, so a stale preview can be cleared. */
  onOperationChange?: () => void
}

function allowsMultipleValues(type: PropertyType): boolean {
  return type === 'text-array' || type === 'tag-array' || type === 'link-array'
}

export default function BulkOpPanel({
  properties,
  opType,
  rows,
  onOpTypeChange,
  onRowsChange,
  onPreview,
  onApply,
  isPreviewing,
  isApplying,
  matchedNotes = [],
  disabled = false,
  disableApply = false,
  applied = false,
  canCommit = false,
  canRevert = false,
  onCommitChanges,
  onRevertChanges,
  onOperationChange,
}: Props) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const propertyNames = properties.map((p) => p.name).sort((a, b) => a.localeCompare(b))

  const valuePlaceholder = (propName: string) =>
    getValuePlaceholder(resolvePropertyType(propName, properties))

  function getPropertyType(propName: string): PropertyType | undefined {
    return properties.find((p) => p.name === propName)?.type
  }

  /** Status of an add-value on a property across the matched notes (single-value caveat handling). */
  function addStatus(property: string) {
    const propType = getPropertyType(property)
    return addValueStatus(matchedNotes, property, propType ? allowsMultipleValues(propType) : false)
  }

  /** Status of a delete-value on a property: whether any matched note actually has content. */
  function deleteStatus(property: string) {
    return deleteValueStatus(matchedNotes, property)
  }

  function canApplyAddValue(property: string): boolean {
    if (!property || !getPropertyType(property)) return false
    return canAddValue(addStatus(property))
  }

  /**
   * The written value must match the target property's type — the server enforces this, but we
   * check up front so the user sees the problem (and Apply/Preview disable) instead of the operation
   * silently doing nothing. Returns the offending field + a message, or null when the row is fine.
   * Only fires once the relevant fields are filled, so it doesn't nag mid-typing. Deleting a value
   * needs no format check (you can remove anything).
   */
  function valueTypeError(row: OpRow): { field: 'value' | 'newValue'; message: string } | null {
    if (opType === 'replace' && row.property && row.newValue) {
      const type = resolvePropertyType(row.property, properties)
      if (!isValidValueForType(row.newValue, type))
        return { field: 'newValue', message: `New value must be ${expectedFormatHint(type)}.` }
    }
    if (opType === 'move-value' && row.toProperty && row.value) {
      const type = resolvePropertyType(row.toProperty, properties)
      if (!isValidValueForType(row.value, type))
        return { field: 'value', message: `Value must be ${expectedFormatHint(type)} for “${row.toProperty}”.` }
    }
    if (opType === 'add-value' && row.property && row.value) {
      const type = resolvePropertyType(row.property, properties)
      if (!isValidValueForType(row.value, type))
        return { field: 'value', message: `Value must be ${expectedFormatHint(type)}.` }
    }
    return null
  }

  /** Build the operation for a single row, or null if it isn't fully/validly specified. */
  function buildOperation(row: OpRow): Operation | null {
    if (valueTypeError(row)) return null
    if (opType === 'delete-value') {
      if (!row.property || !row.value) return null
      if (!canDeleteValue(deleteStatus(row.property))) return null
      return { type: 'delete-value', property: row.property, value: row.value }
    }
    if (opType === 'replace') {
      if (!row.property || !row.value || !row.newValue) return null
      return { type: 'replace', property: row.property, oldValue: row.value, newValue: row.newValue }
    }
    if (opType === 'move-value') {
      if (!isMoveValid(row.fromProperty, row.toProperty, row.value)) return null
      return { type: 'move-value', fromProperty: row.fromProperty, toProperty: row.toProperty, value: row.value }
    }
    if (opType === 'add-value') {
      if (!row.property || !row.value || !canApplyAddValue(row.property)) return null
      return { type: 'add-value', property: row.property, value: row.value }
    }
    return null
  }

  const operations = rows.map(buildOperation).filter((op): op is Operation => op !== null)
  // Apply only when every row is valid, so a half-filled row can never be silently skipped.
  const allValid = rows.length > 0 && operations.length === rows.length

  // Notify the parent whenever the configured operations *actually change*, so a stale preview/result
  // (and the disabled state derived from it) can be cleared. Comparing against the last signature —
  // rather than a "first render" flag — means a restored draft isn't treated as a change on mount,
  // and it's safe under StrictMode's double-invoked effects (same signature → no spurious clear).
  const opSignature = JSON.stringify({ opType, rows })
  const lastSignature = useRef(opSignature)
  useEffect(() => {
    if (lastSignature.current === opSignature) return
    lastSignature.current = opSignature
    onOperationChange?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opSignature])

  function updateRow(id: string, patch: Partial<OpRow>) {
    onRowsChange(updateOpRow(rows, id, patch))
  }
  function addRow() {
    onRowsChange([...rows, makeRow()])
  }
  function removeRow(id: string) {
    onRowsChange(removeOpRow(rows, id))
  }

  const addAnotherLabel = opType === 'move-value' ? 'Add move' : 'Add property'

  // Column labels shown once above the rows, matching the fields rendered per row below.
  const fieldLabels =
    opType === 'move-value'
      ? ['From property', 'To property', 'Value to move']
      : opType === 'replace'
        ? ['Property', 'Current value', 'New value']
        : opType === 'delete-value'
          ? ['Property', 'Value to delete']
          : ['Property', 'Value to add']

  return (
    <div className={styles.panel}>
      <div className={styles.typeRow}>
        {(['delete-value', 'replace', 'move-value', 'add-value'] as OpType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.typeBtn} ${opType === t ? styles.selected : ''}`}
            onClick={() => onOpTypeChange(t)}
          >
            {t === 'delete-value' ? 'Delete value' : t === 'replace' ? 'Replace value' : t === 'move-value' ? 'Move value' : 'Add value'}
          </button>
        ))}
      </div>

      <div className={styles.rows}>
        <div className={styles.labels}>
          {fieldLabels.map((label) => (
            <span key={label} className={styles.label}>{label}</span>
          ))}
          <span className={styles.removeSpacer} />
        </div>

        {rows.map((row) => {
          const typeError = valueTypeError(row)
          const invalid = (field: 'value' | 'newValue') => typeError?.field === field
          // Amber caveats when an operation can't (fully) change anything across the matched notes.
          const addState = opType === 'add-value' && row.property ? addStatus(row.property) : 'ok'
          const deleteState = opType === 'delete-value' && row.property ? deleteStatus(row.property) : 'ok'
          const opWarning =
            addState === 'some-skipped'
              ? "Some notes already have a value for this single-value property. They won't be affected by this operation."
              : addState === 'all-skipped'
                ? 'All notes already have a value for this single-value property. Operation will not change anything.'
                : deleteState === 'some-skipped'
                  ? "Some notes do not have the property defined or the property is empty. They won't be affected by this operation."
                  : deleteState === 'all-skipped'
                    ? 'All notes either do not have the property defined or the property is empty. Operation will not change anything.'
                    : null

          return (
            <div key={row.id}>
              <div className={`${styles.rule} ${hoveredRowId === row.id ? styles.ruleHoverDelete : ''}`}>
                {opType === 'delete-value' && (
                  <>
                    <div className={styles.field}>
                      <Selector value={row.property} onChange={(v) => updateRow(row.id, { property: v })} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
                    </div>
                    <div className={styles.field}>
                      <ValueInput value={row.value} onChange={(v) => updateRow(row.id, { value: v })} placeholder={valuePlaceholder(row.property)} />
                    </div>
                  </>
                )}

                {opType === 'replace' && (
                  <>
                    <div className={styles.field}>
                      <Selector value={row.property} onChange={(v) => updateRow(row.id, { property: v })} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
                    </div>
                    <div className={styles.field}>
                      <ValueInput value={row.value} onChange={(v) => updateRow(row.id, { value: v })} placeholder={valuePlaceholder(row.property)} />
                    </div>
                    <div className={styles.field}>
                      <ValueInput value={row.newValue} onChange={(v) => updateRow(row.id, { newValue: v })} placeholder={valuePlaceholder(row.property)} invalid={invalid('newValue')} />
                    </div>
                  </>
                )}

                {opType === 'move-value' && (
                  <>
                    <div className={styles.field}>
                      <Selector value={row.fromProperty} onChange={(v) => updateRow(row.id, { fromProperty: v })} options={movableFromOptions(propertyNames, row.toProperty)} placeholder="select property" emptyMessage="No matching property" />
                    </div>
                    <div className={styles.field}>
                      <Selector value={row.toProperty} onChange={(v) => updateRow(row.id, { toProperty: v })} options={movableFromOptions(propertyNames, row.fromProperty)} placeholder="select property" emptyMessage="No matching property" />
                    </div>
                    <div className={styles.field}>
                      <ValueInput value={row.value} onChange={(v) => updateRow(row.id, { value: v })} placeholder={valuePlaceholder(row.fromProperty)} invalid={invalid('value')} />
                    </div>
                  </>
                )}

                {opType === 'add-value' && (
                  <>
                    <div className={styles.field}>
                      <Selector value={row.property} onChange={(v) => updateRow(row.id, { property: v })} options={propertyNames} placeholder="select property" emptyMessage="No matching property" />
                    </div>
                    <div className={styles.field}>
                      <ValueInput value={row.value} onChange={(v) => updateRow(row.id, { value: v })} placeholder={valuePlaceholder(row.property)} invalid={invalid('value')} />
                    </div>
                  </>
                )}

                <Tooltip content="Delete">
                  <button
                    type="button"
                    className={styles.removeBtn}
                    aria-label="Delete"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    onMouseEnter={() => setHoveredRowId(row.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <Trash2 size={18} />
                  </button>
                </Tooltip>
              </div>

              {opWarning && (
                <div className={styles.warning}>
                  <AlertTriangle size={15} className={styles.warningIcon} />
                  <span>{opWarning}</span>
                </div>
              )}
            </div>
          )
        })}

        <button type="button" className={styles.addRowBtn} onClick={addRow}>
          + {addAnotherLabel}
        </button>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => allValid && onPreview(operations)}
          disabled={disabled || !allValid || isPreviewing || isApplying || applied}
        >
          {isPreviewing ? 'Previewing…' : 'Preview'}
        </button>
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => allValid && onApply(operations)}
          disabled={disabled || !allValid || isPreviewing || isApplying || disableApply || applied}
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
