import { useState } from 'react'
import type { FilterRule, PropertyDef } from '@shared/types'
import { getOperators, getPropertyType, DIRECTORY_OPERATORS, SIMPLE_PROPERTY_OPERATORS } from '../lib/operators'
import DirSelect from './DirSelect'
import styles from './FilterBuilder.module.css'

interface Props {
  rules: FilterRule[]
  onChange: (rules: FilterRule[]) => void
  onRun: () => void
  isRunning: boolean
  properties: PropertyDef[]
  dirs: string[]
}

const listId = 'prop-autocomplete'

function isValidLinkSyntax(value: string): boolean {
  if (!value.trim()) return true
  return /^\[\[.+\]\]$/.test(value.trim())
}

function ruleIsValid(rule: FilterRule, defs: PropertyDef[]): boolean {
  if (!rule.property) return false
  if (rule.kind === 'directory') return true
  const type = getPropertyType(rule.property, defs)
  if (type === 'link' || type === 'link-array') {
    return isValidLinkSyntax(rule.value)
  }
  return true
}

export default function FilterBuilder({ rules, onChange, onRun, isRunning, properties, dirs }: Props) {
  const [invalidRules, setInvalidRules] = useState<Set<number>>(new Set())
  function addRule() {
    onChange([
      ...rules,
      { kind: 'property', property: '', operator: 'contains', value: '', combinator: 'and' },
    ])
  }

  function removeRule(idx: number) {
    onChange(rules.filter((_, i) => i !== idx))
  }

  function updateRule(idx: number, patch: Partial<FilterRule>) {
    const next = rules.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, ...patch }

      if ('kind' in patch && patch.kind !== r.kind) {
        updated.property = ''
        updated.value = ''
        updated.operator = patch.kind === 'directory' ? 'equals' : 'contains'
      } else if ('property' in patch && patch.property !== r.property) {
        const ops = updated.kind === 'directory' ? DIRECTORY_OPERATORS : getOperators(patch.property ?? '', properties)
        if (ops.length > 0 && !ops.find((o) => o.value === updated.operator)) {
          updated.operator = ops[0].value
        }
        updated.value = ''
      }
      return updated
    })
    onChange(next)
  }

  return (
    <div className={styles.builder}>
      <datalist id={listId}>
        {properties.map((p) => (
          <option key={p.name} value={p.name} />
        ))}
      </datalist>

      <div className={styles.rules}>
        {rules.map((rule, idx) => {
          const operators = rule.kind === 'directory' ? DIRECTORY_OPERATORS : getOperators(rule.property, properties)
          const type = rule.kind === 'directory' ? undefined : getPropertyType(rule.property, properties)

          return (
            <div key={idx} className={styles.rule}>
              {idx === 0 ? (
                <span className={styles.combinator}>Where</span>
              ) : (
                <select
                  className={styles.combinatorSelect}
                  value={rule.combinator}
                  onChange={(e) =>
                    updateRule(idx, { combinator: e.target.value as 'and' | 'or' })
                  }
                >
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                </select>
              )}

              <select
                className={styles.kindSelect}
                value={rule.kind}
                onChange={(e) => updateRule(idx, { kind: e.target.value as 'property' | 'directory' })}
              >
                <option value="property">property</option>
                <option value="directory">directory</option>
              </select>

              {rule.kind === 'directory' ? (
                <>
                  <select
                    className={styles.operatorSelect}
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(idx, { operator: e.target.value as FilterRule['operator'] })
                    }
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <DirSelect
                    value={rule.property}
                    onChange={(v) => updateRule(idx, { property: v })}
                    dirs={dirs}
                    placeholder="select directory"
                  />
                </>
              ) : (
                <>
                  <input
                    className={styles.propInput}
                    list={listId}
                    value={rule.property}
                    onChange={(e) => updateRule(idx, { property: e.target.value })}
                    placeholder="property"
                  />

                  <select
                    className={styles.operatorSelect}
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(idx, { operator: e.target.value as FilterRule['operator'] })
                    }
                  >
                    {SIMPLE_PROPERTY_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {type === 'boolean' ? (
                    <select
                      className={styles.valueSelect}
                      value={rule.value}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      className={`${styles.valueInput} ${
                        invalidRules.has(idx) && (type === 'link' || type === 'link-array')
                          ? styles.valueInputInvalid
                          : ''
                      }`}
                      type={type === 'date' ? 'date' : 'text'}
                      value={rule.value}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                      onBlur={() => {
                        if (type === 'link' || type === 'link-array') {
                          if (isValidLinkSyntax(rule.value)) {
                            setInvalidRules((prev) => {
                              const next = new Set(prev)
                              next.delete(idx)
                              return next
                            })
                          } else if (rule.value.trim()) {
                            setInvalidRules((prev) => new Set(prev).add(idx))
                          }
                        }
                      }}
                      placeholder={
                        type === 'link' || type === 'link-array'
                          ? '[[Note Name]]'
                          : type === 'week-link'
                            ? '[[2026-W22]]'
                            : type === 'tag-array'
                              ? 'tag/subtag'
                              : 'value'
                      }
                    />
                  )}
                </>
              )}

              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeRule(idx)}
                title="Remove rule"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.addBtn} onClick={addRule}>
          + Add rule
        </button>
        <button
          type="button"
          className={styles.runBtn}
          onClick={onRun}
          disabled={
            isRunning ||
            rules.length === 0 ||
            rules.some((r) => !ruleIsValid(r, properties)) ||
            invalidRules.size > 0
          }
        >
          {isRunning ? 'Searching…' : 'Find notes'}
        </button>
      </div>
    </div>
  )
}
