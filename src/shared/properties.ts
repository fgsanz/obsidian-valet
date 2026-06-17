import type { PropertyType, PropertyDef } from './types'

/**
 * Resolve the effective type of a property by name.
 *
 * `tags` is a built-in Obsidian property and is always a tag-array, regardless of how a vault's
 * stored config (or earlier value inference) may have classified it. This is the single source
 * of truth for that rule, shared by both client and server.
 */
export function resolvePropertyType(name: string, defs: PropertyDef[]): PropertyType {
  if (name === 'tags') return 'tag-array'
  return defs.find((d) => d.name === name)?.type ?? 'text'
}

/**
 * Whether a raw string value is acceptable for the given property type. The server is the authority
 * and re-checks this before writing, but the client uses the same rule to validate input up front.
 * Single source of truth — keep client and server in lock-step.
 */
export function isValidValueForType(value: string, type: PropertyType): boolean {
  const v = value.trim()
  if (v === '') return false
  switch (type) {
    case 'text':
    case 'text-array':
      return true
    case 'tag-array':
      // A tag is an alphanumeric string, or several joined by "/" (e.g. tag or tag/subtag).
      return /^[A-Za-z0-9]+(\/[A-Za-z0-9]+)*$/.test(v)
    case 'number':
      return !Number.isNaN(Number(v))
    case 'boolean':
      return /^(true|false)$/i.test(v)
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(v)
    case 'week-link':
      return /^\[\[\d{4}-W\d{1,2}\]\]$/.test(v)
    case 'link':
    case 'link-array':
      return /^\[\[.+\]\]$/.test(v)
    default:
      return true
  }
}

/** A short, human-readable hint of the expected format for a property type — used in error text. */
export function expectedFormatHint(type: PropertyType): string {
  switch (type) {
    case 'tag-array':
      return 'a tag like tag or tag/subtag'
    case 'number':
      return 'a number'
    case 'boolean':
      return 'true or false'
    case 'date':
      return 'a date like 2026-01-01'
    case 'week-link':
      return 'a week link like [[2026-W08]]'
    case 'link':
    case 'link-array':
      return 'a link like [[Note name]]'
    default:
      return 'a value'
  }
}
