import { z } from 'zod'

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

export const filterRuleSchema = z.object({
  kind: z.enum(['property', 'directory']).default('property'),
  property: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'not-equals', 'not-contains', 'before', 'after']),
  value: z.string(),
  combinator: z.enum(['and', 'or']),
})

export const operationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('change-value'),
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
])
