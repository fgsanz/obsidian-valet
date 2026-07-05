import type { PropertyType, PropertyDef, FilterOperator, PropertyOperator } from '@shared/types'
import { resolvePropertyType } from '@shared/properties'

export interface OperatorOption {
  value: FilterOperator
  label: string
}

export interface PropertyOperatorOption {
  value: PropertyOperator
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

export const DIRECTORY_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'is' },
  { value: 'not-equals', label: 'is not' },
]

export const SIMPLE_PROPERTY_OPERATORS: PropertyOperatorOption[] = [
  { value: 'exists', label: 'exists' },
  { value: 'contains', label: 'exists and contains' },
  { value: 'not-contains', label: 'exists and does not contain' },
  { value: 'exists-and-empty', label: 'exists and is empty' },
  { value: 'exists-and-not-empty', label: 'exists and is not empty' },
  { value: 'does-not-exist', label: 'does not exist' },
]

/** Operators that filter purely on presence/emptiness and take no value input. */
export const VALUELESS_PROPERTY_OPERATORS: PropertyOperator[] = [
  'exists-and-empty',
  'exists-and-not-empty',
  'exists',
  'does-not-exist',
]

export function operatorNeedsValue(operator: PropertyOperator): boolean {
  return !VALUELESS_PROPERTY_OPERATORS.includes(operator)
}

export function getPropertyType(property: string, defs: PropertyDef[]): PropertyType {
  return resolvePropertyType(property, defs)
}

const LINK_PLACEHOLDER = 'e.g., [[note name]]'

/** Example placeholder text for a property rule's value field, by property type. */
const VALUE_PLACEHOLDERS: Record<PropertyType, string> = {
  text: 'e.g., value',
  'text-array': 'e.g., value',
  number: 'e.g., 42',
  boolean: 'e.g., true',
  date: 'e.g., 2026-01-01',
  'week-link': 'e.g., [[2026-W08]]',
  'tag-array': 'e.g., tag/subtag',
  link: LINK_PLACEHOLDER,
  'link-array': LINK_PLACEHOLDER,
}

export function getValuePlaceholder(type: PropertyType): string {
  return VALUE_PLACEHOLDERS[type]
}

/**
 * Property names available as the "move from" source, excluding the property already chosen as the
 * "move to" target — moving a value from a property into itself is meaningless.
 */
export function movableFromOptions(allProperties: string[], toProperty: string): string[] {
  return allProperties.filter((name) => name !== toProperty)
}

/**
 * Whether a move-value operation is valid: both properties and a value are set, and the source and
 * target are different (moving a value into the same property is meaningless).
 */
export function isMoveValid(fromProperty: string, toProperty: string, value: string): boolean {
  return !!fromProperty && !!toProperty && !!value && fromProperty !== toProperty
}
