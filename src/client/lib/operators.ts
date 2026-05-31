import type { PropertyType, FilterOperator } from '@shared/types'

export interface OperatorOption {
  value: FilterOperator
  label: string
}

export const OPERATORS_BY_TYPE: Record<PropertyType, OperatorOption[]> = {
  text: [
    { value: 'equals', label: 'is' },
    { value: 'not-equals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'not-contains', label: 'does not contain' },
  ],
  'text-array': [
    { value: 'contains', label: 'contains' },
    { value: 'not-contains', label: 'does not contain' },
    { value: 'equals', label: 'is exactly' },
    { value: 'not-equals', label: 'is not exactly' },
  ],
  link: [
    { value: 'contains', label: 'links to' },
    { value: 'not-contains', label: 'does not link to' },
    { value: 'equals', label: 'is exactly' },
    { value: 'not-equals', label: 'is not' },
  ],
  'link-array': [
    { value: 'contains', label: 'contains link to' },
    { value: 'not-contains', label: 'does not contain link to' },
    { value: 'equals', label: 'has exactly' },
    { value: 'not-equals', label: 'does not have exactly' },
  ],
  'tag-array': [
    { value: 'contains', label: 'has tag' },
    { value: 'not-contains', label: 'does not have tag' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'not-equals', label: 'is not' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
  ],
  'week-link': [
    { value: 'equals', label: 'is week' },
    { value: 'not-equals', label: 'is not week' },
    { value: 'before', label: 'is before week' },
    { value: 'after', label: 'is after week' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not-equals', label: '≠' },
    { value: 'before', label: '<' },
    { value: 'after', label: '>' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
    { value: 'not-equals', label: 'is not' },
  ],
}

export function getOperators(property: string, defs: { name: string; type: PropertyType }[]): OperatorOption[] {
  const def = defs.find((d) => d.name === property)
  return OPERATORS_BY_TYPE[def?.type ?? 'text']
}

export function getPropertyType(property: string, defs: { name: string; type: PropertyType }[]): PropertyType {
  return defs.find((d) => d.name === property)?.type ?? 'text'
}
