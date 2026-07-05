import { z } from 'zod'

/**
 * Persisted user settings. Every field uses `.catch(default)` so a missing key falls back to its
 * default and an invalid value is replaced rather than throwing — and unknown keys are stripped.
 * This makes the stored file forward/backward compatible: a newer version adding a field "just
 * works" against an older file, and a hand-edited file can't break startup.
 */
export const userSettingsSchema = z.object({
  schemaVersion: z.number().catch(1),
  colorScheme: z.enum(['light', 'dark', 'system']).catch('system'),
  checkForUpdates: z.boolean().catch(true),
  dismissedVersion: z.string().nullable().catch(null),
  // Ids of vaults for which the user has acknowledged the "no Git rollback" notice — never
  // warn again for these. Other vaults still get the notice.
  gitAckVaultIds: z.array(z.string()).catch([]),
})

export type UserSettings = z.infer<typeof userSettingsSchema>

export const propertyTypeSchema = z.enum([
  'text',
  'text-array',
  'number',
  'boolean',
  'date',
  'week-link',
  'tag-array',
  'link',
  'link-array',
])

export const propertyDefSchema = z.object({
  name: z.string().min(1),
  type: propertyTypeSchema,
})

export const vaultSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  path: z.string().min(1),
  forbiddenDirs: z.array(z.string()).default([]),
  properties: z.array(propertyDefSchema).default([]),
})

export const createVaultSchema = vaultSchema.omit({ id: true })

export const locationRuleSchema = z.object({
  operator: z.enum(['all-directories', 'directory-is', 'directory-is-not']),
  directory: z.string().optional(),
  combinator: z.enum(['and', 'or']),
})

export const propertyRuleSchema = z.object({
  property: z.string().min(1),
  operator: z.enum([
    'contains',
    'not-contains',
    'exists-and-empty',
    'exists-and-not-empty',
    'exists',
    'does-not-exist',
  ]),
  value: z.string().optional(),
  combinator: z.enum(['and', 'or']),
  caseSensitive: z.boolean().optional().default(false),
})

export const filterCriteriaSchema = z.object({
  location: z.array(locationRuleSchema).min(1),
  properties: z.array(propertyRuleSchema).min(1),
})

export const filterRuleSchema = z.object({
  kind: z.enum(['property', 'directory']).default('property'),
  property: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'not-equals', 'not-contains', 'before', 'after']),
  value: z.string(),
  combinator: z.enum(['and', 'or']),
})

export const kindleSplitPropertySchema = z.object({
  name: z.string().min(1),
  value: z.string(),
})

export const kindleSplitOptionsSchema = z.object({
  prefix: z.string().min(1),
  startNumber: z.number().int().min(0).default(1),
  targetDir: z.string(),
  properties: z.array(kindleSplitPropertySchema).default([]),
  deleteOriginal: z.boolean().default(false),
})

export const operationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('replace'),
    property: z.string(),
    oldValue: z.string(),
    newValue: z.string(),
  }),
  z.object({
    type: z.literal('move-value'),
    fromProperty: z.string(),
    toProperty: z.string(),
    value: z.string(),
  }),
  z.object({
    type: z.literal('delete-value'),
    property: z.string(),
    value: z.string(),
  }),
  z.object({
    type: z.literal('add-value'),
    property: z.string(),
    value: z.string(),
  }),
])
