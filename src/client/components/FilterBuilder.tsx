import type { FilterRule, PropertyDef } from '@shared/types'
import { getOperators, getPropertyType } from '../lib/operators'
import styles from './FilterBuilder.module.css'

interface Props {
  rules: FilterRule[]
  onChange: (rules: FilterRule[]) => void
  onRun: () => void
  isRunning: boolean
  properties: PropertyDef[]
}

const listId = 'prop-autocomplete'

export default function FilterBuilder({ rules, onChange, onRun, isRunning, properties }: Props) {
  function addRule() {
    onChange([
      ...rules,
      { property: '', operator: 'contains', value: '', combinator: 'and' },
    ])
  }

  function removeRule(idx: number) {
    onChange(rules.filter((_, i) => i !== idx))
  }

  function updateRule(idx: number, patch: Partial<FilterRule>) {
    const next = rules.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, ...patch }
      if ('property' in patch && patch.property !== r.property) {
        const ops = getOperators(patch.property ?? '', properties)
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
          const operators = getOperators(rule.property, properties)
          const type = getPropertyType(rule.property, properties)

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
                {operators.map((op) => (
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
                  className={styles.valueInput}
                  type={type === 'date' ? 'date' : 'text'}
                  value={rule.value}
                  onChange={(e) => updateRule(idx, { value: e.target.value })}
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
          disabled={isRunning || rules.length === 0 || rules.some((r) => !r.property)}
        >
          {isRunning ? 'Searching…' : 'Find notes'}
        </button>
      </div>
    </div>
  )
}
