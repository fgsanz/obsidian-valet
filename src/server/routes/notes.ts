import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getConfig } from '../config/config'
import { scanVault, getCachedNotes, invalidateCache } from '../services/scanner'
import { filterByCriteria } from '../services/filter'
import { applyOperations, previewOperations } from '../services/operations'
import { filterCriteriaSchema, operationSchema } from '@shared/schemas'

const operationsSchema = z.array(operationSchema).min(1)

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

    // Always re-scan from disk so results reflect the real current state of the vault, including
    // changes made externally (e.g. in Obsidian) since the last scan. This also refreshes the
    // cache used by the subsequent preview/apply calls.
    const notes = await scanVault(vault)

    const matched = filterByCriteria(notes, criteria, vault.properties)
    return { data: matched }
  })

  fastify.post('/notes/preview-operation', async (request, reply) => {
    const { vaultId, criteria, operations } = z
      .object({
        vaultId: z.string(),
        criteria: filterCriteriaSchema,
        operations: operationsSchema,
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
    const previews = previewOperations(matched, operations, vault.properties)
    return { data: previews }
  })

  fastify.post('/notes/apply-operation', async (request, reply) => {
    const { vaultId, criteria, operations } = z
      .object({
        vaultId: z.string(),
        criteria: filterCriteriaSchema,
        operations: operationsSchema,
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
    // Apply every operation in order to the matched notes; the table then shows each note's final
    // state, with both the filtered and the operated-on properties visible.
    const { result, notesAfter } = await applyOperations(matched, operations, vault.properties)

    invalidateCache(vaultId)
    return { data: { result, notes: notesAfter } }
  })
}
