import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getConfig } from '../config/config'
import { scanVault, getCachedNotes, invalidateCache } from '../services/scanner'
import { filterNotes } from '../services/filter'
import { applyOperation, previewOperation } from '../services/operations'
import { filterRuleSchema, operationSchema } from '@shared/schemas'

export const notesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.post('/notes/scan', async (request, reply) => {
    const { vaultId } = z.object({ vaultId: z.string() }).parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const notes = await scanVault(vault)
    return { data: { count: notes.length } }
  })

  fastify.post('/notes/filter', async (request, reply) => {
    const { vaultId, rules } = z
      .object({ vaultId: z.string(), rules: z.array(filterRuleSchema) })
      .parse(request.body)

    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }

    let notes = getCachedNotes(vaultId)
    if (!notes) {
      notes = await scanVault(vault)
    }

    const matched = filterNotes(notes, rules, vault.properties)
    return { data: matched }
  })

  fastify.post('/notes/preview-operation', async (request, reply) => {
    const { vaultId, rules, operation } = z
      .object({
        vaultId: z.string(),
        rules: z.array(filterRuleSchema),
        operation: operationSchema,
      })
      .parse(request.body)

    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }

    let notes = getCachedNotes(vaultId)
    if (!notes) notes = await scanVault(vault)

    const matched = filterNotes(notes, rules, vault.properties)
    const previews = previewOperation(matched, operation, vault.properties)
    return { data: previews }
  })

  fastify.post('/notes/apply-operation', async (request, reply) => {
    const { vaultId, rules, operation } = z
      .object({
        vaultId: z.string(),
        rules: z.array(filterRuleSchema),
        operation: operationSchema,
      })
      .parse(request.body)

    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }

    let notes = getCachedNotes(vaultId)
    if (!notes) notes = await scanVault(vault)

    const matched = filterNotes(notes, rules, vault.properties)
    const result = await applyOperation(matched, operation, vault.properties)

    invalidateCache(vaultId)
    return { data: result }
  })
}
