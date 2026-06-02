import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { LocationRule, PropertyRule, FilterCriteria, PropertyDef } from '@shared/types'
import { SIMPLE_PROPERTY_OPERATORS } from '../lib/operators'
import DirSelect from './DirSelect'
import Tooltip from './Tooltip'
import styles from './FilterBuilder.module.css'

interface Props {
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  onRun: () => void
  isRunning: boolean
  properties: PropertyDef[]
  dirs: string[]
}

const propListId = 'prop-autocomplete'

function isValidPropertyRule(rule: PropertyRule, defs: PropertyDef[]): boolean {
  if (!rule.property) return false
  const def = defs.find((d) => d.name === rule.property)
  const type = def?.type ?? 'text'
  if (rule.operator === 'exists-and-empty' || rule.operator === 'does-not-exist') return true
  const isLink = type === 'link' || type === 'link-array'
  if (isLink && rule.value) {
    return /^\[\[.+\]\]$/.test(rule.value.trim())
  }
  return !!rule.value?.trim()
}

function criteriaIsValid(criteria: FilterCriteria, defs: PropertyDef[]): boolean {
  if (criteria.location.length === 0 || criteria.properties.length === 0) return false
  return criteria.properties.every((r) => isValidPropertyRule(r, defs))
}

export default function FilterBuilder({
  criteria,
  onChange,
  onRun,
  isRunning,
  properties,
  dirs,
}: Props) {
  const [invalidRuleIdx, setInvalidRuleIdx] = useState<number | null>(null)
  const [hoveredLocationIdx, setHoveredLocationIdx] = useState<number | null>(null)
  const [hoveredPropertyIdx, setHoveredPropertyIdx] = useState<number | null>(null)

  function updateLocationRule(idx: number, patch: Partial<LocationRule>) {
    const next = { ...criteria }
    next.location = next.location.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, ...patch }
      if ('operator' in patch && patch.operator !== r.operator) {
        updated.directory = undefined
      }
      return updated
    })
    onChange(next)
  }

  function removeLocationRule(idx: number) {
    const next = { ...criteria }
    next.location = next.location.filter((_, i) => i !== idx)
    onChange(next)
  }

  function addLocationRule() {
    const next = { ...criteria }
    next.location = [...next.location, { operator: 'all-directories', combinator: 'and' }]
    onChange(next)
  }

  function updatePropertyRule(idx: number, patch: Partial<PropertyRule>) {
    const next = { ...criteria }
    next.properties = next.properties.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, ...patch }
      if ('operator' in patch && (patch.operator === 'exists-and-empty' || patch.operator === 'does-not-exist')) {
        updated.value = undefined
      }
      return updated
    })
    onChange(next)
  }

  function removePropertyRule(idx: number) {
    const next = { ...criteria }
    next.properties = next.properties.filter((_, i) => i !== idx)
    onChange(next)
  }

  function addPropertyRule() {
    const next = { ...criteria }
    next.properties = [
      ...next.properties,
      { property: '', operator: 'contains', combinator: 'and' },
    ]
    onChange(next)
  }

  return (
    <div className={styles.builder}>
      <datalist id={propListId}>
        {properties.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>

      {/* ── Location Section ─────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Location</div>
        <div className={styles.rules}>
          {criteria.location.map((rule, idx) => (
            <div key={idx} className={`${styles.rule} ${hoveredLocationIdx === idx ? styles.ruleHoverDelete : ''}`}>
              {idx === 0 ? (
                <span className={styles.combinator}>Where</span>
              ) : (
                <select
                  className={styles.combinatorSelect}
                  value={rule.combinator}
                  onChange={(e) =>
                    updateLocationRule(idx, { combinator: e.target.value as 'and' | 'or' })
                  }
                >
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                </select>
              )}

              <select
                className={styles.operatorSelect}
                value={rule.operator}
                onChange={(e) =>
                  updateLocationRule(idx, {
                    operator: e.target.value as any,
                  })
                }
              >
                <option value="all-directories">all allowed directories</option>
                <option value="directory-is">directory is</option>
                <option value="directory-is-not">directory is not</option>
              </select>

              {rule.operator !== 'all-directories' && (
                <DirSelect
                  value={rule.directory ?? ''}
                  onChange={(v) => updateLocationRule(idx, { directory: v })}
                  dirs={dirs}
                  placeholder="select directory"
                />
              )}

              <div className={styles.ruleActions}>
                <Tooltip content="Delete rule">
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeLocationRule(idx)}
                    disabled={criteria.location.length === 1}
                    onMouseEnter={() => setHoveredLocationIdx(idx)}
                    onMouseLeave={() => setHoveredLocationIdx(null)}
                  >
                    <Trash2 size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className={styles.addBtn} onClick={addLocationRule}>
          + Add rule
        </button>
      </div>

      {/* ── Properties Section ───────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Properties</div>
        <div className={styles.rules}>
          {criteria.properties.map((rule, idx) => {
            const def = properties.find((d) => d.name === rule.property)
            const type = def?.type ?? 'text'
            const isLink = type === 'link' || type === 'link-array'

            return (
              <div key={idx} className={`${styles.rule} ${hoveredPropertyIdx === idx ? styles.ruleHoverDelete : ''}`}>
                {idx === 0 ? (
                  <span className={styles.combinator}>Where</span>
                ) : (
                  <select
                    className={styles.combinatorSelect}
                    value={rule.combinator}
                    onChange={(e) =>
                      updatePropertyRule(idx, { combinator: e.target.value as 'and' | 'or' })
                    }
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                )}

                <input
                  className={styles.propInput}
                  list={propListId}
                  value={rule.property}
                  onChange={(e) => updatePropertyRule(idx, { property: e.target.value })}
                  placeholder="property"
                />

                <select
                  className={styles.operatorSelect}
                  value={rule.operator}
                  onChange={(e) =>
                    updatePropertyRule(idx, { operator: e.target.value as any })
                  }
                >
                  {SIMPLE_PROPERTY_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {rule.operator !== 'exists-and-empty' && rule.operator !== 'does-not-exist' && (
                  <input
                    className={`${styles.valueInput} ${
                      invalidRuleIdx === idx && isLink ? styles.valueInputInvalid : ''
                    }`}
                    type="text"
                    value={rule.value ?? ''}
                    onChange={(e) => updatePropertyRule(idx, { value: e.target.value })}
                    onBlur={() => {
                      if (isLink && rule.value?.trim()) {
                        if (/^\[\[.+\]\]$/.test(rule.value.trim())) {
                          setInvalidRuleIdx(null)
                        } else {
                          setInvalidRuleIdx(idx)
                        }
                      } else {
                        setInvalidRuleIdx(null)
                      }
                    }}
                    placeholder={isLink ? '[[Note Name]]' : 'value'}
                  />
                )}

                <div className={styles.ruleActions}>
                  {rule.operator !== 'exists-and-empty' && rule.operator !== 'does-not-exist' && (
                    <Tooltip content={rule.caseSensitive ? 'Match case ON' : 'Match case OFF'}>
                      <button
                        type="button"
                        className={`${styles.caseBtn} ${rule.caseSensitive ? styles.caseBtnActive : ''}`}
                        onClick={() => updatePropertyRule(idx, { caseSensitive: !rule.caseSensitive })}
                        title={rule.caseSensitive ? 'Match case ON' : 'Match case OFF'}
                      >
                        Aa
                      </button>
                    </Tooltip>
                  )}

                  <Tooltip content="Delete rule">
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removePropertyRule(idx)}
                      disabled={criteria.properties.length === 1}
                      onMouseEnter={() => setHoveredPropertyIdx(idx)}
                      onMouseLeave={() => setHoveredPropertyIdx(null)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>

        <button type="button" className={styles.addBtn} onClick={addPropertyRule}>
          + Add rule
        </button>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.runBtn}
          onClick={onRun}
          disabled={isRunning || !criteriaIsValid(criteria, properties)}
        >
          {isRunning ? 'Searching…' : 'Find notes'}
        </button>
      </div>
    </div>
  )
}
