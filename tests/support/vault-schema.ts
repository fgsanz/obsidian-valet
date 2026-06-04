import type { PropertyDef } from '@shared/types'

/**
 * Explicit property schema for the test vault. Declared here (rather than relying on
 * runtime type discovery) so that filtering behaviour in tests is deterministic.
 */
export const TEST_VAULT_PROPERTIES: PropertyDef[] = [
  { name: 'tags', type: 'tag-array' },
  { name: 'aliases', type: 'text-array' },
  { name: 'date', type: 'date' },
  { name: 'week', type: 'week-link' },
  { name: 'time', type: 'text' },
  { name: 'read', type: 'boolean' },
  { name: 'number headings', type: 'text' },
  { name: 'parent', type: 'link-array' },
  { name: 'related', type: 'link-array' },
]
