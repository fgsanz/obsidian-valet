import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getConfig } from '../config/config'
import { scanVault, getCachedNotes, invalidateCache } from '../services/scanner'
import { filterByCriteria } from '../services/filter'
import { applyOperation, previewOperation } from '../services/operations'
import { filterCriteriaSchema, operationSchema } from '@shared/schemas'

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
    const { vaultId, criteria } = z
      .object({ vaultId: z.string(), criteria: filterCriteriaSchema })
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

    const matched = filterByCriteria(notes, criteria, vault.properties)
    return { data: matched }
  })

  fastify.post('/notes/preview-operation', async (request, reply) => {
    const { vaultId, criteria, operation } = z
      .object({
        vaultId: z.string(),
        criteria: filterCriteriaSchema,
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

    const matched = filterByCriteria(notes, criteria, vault.properties)
    const previews = previewOperation(matched, operation, vault.properties)
    return { data: previews }
  })

  fastify.post('/notes/apply-operation', async (request, reply) => {
    const { vaultId, criteria, operation } = z
      .object({
        vaultId: z.string(),
        criteria: filterCriteriaSchema,
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

    const matched = filterByCriteria(notes, criteria, vault.properties)
    // Compute the post-operation state of the matched notes (the changed ones get their new
    // values; unchanged ones stay as-is) so the results table can show values AFTER the edit.
    const previews = previewOperation(matched, operation, vault.properties)
    const previewByPath = new Map(previews.map((n) => [n.filePath, n]))
    const result = await applyOperation(matched, operation, vault.properties)
    const notesAfter = matched.map((n) => previewByPath.get(n.filePath) ?? n)

    invalidateCache(vaultId)
    return { data: { result, notes: notesAfter } }
  })
}
