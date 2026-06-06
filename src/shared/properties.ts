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
