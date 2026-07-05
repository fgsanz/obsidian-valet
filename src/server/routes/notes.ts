import type { FastifyPluginAsync } from 'fastify'
import { stat } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'
import { getConfig } from '../config/config'
import { scanVault, getCachedNotes, invalidateCache } from '../services/scanner'
import { filterByCriteria } from '../services/filter'
import { applyOperations, previewOperations } from '../services/operations'
import { isKindleNote, parseKindleNote, buildSplitNotes } from '../services/kindle'
import { applyKindleSplit, revertKindleSplit, KindleSplitError } from '../services/kindleSplit'
import { filterCriteriaSchema, operationSchema, kindleSplitOptionsSchema } from '@shared/schemas'
import type { NoteSummary } from '@shared/types'

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

  // ── Kindle highlights split ───────────────────────────────────────────────

  /** Compact list of every note (name, folder, Kindle-detection) for the split note-picker. */
  fastify.post('/notes/list', async (request, reply) => {
    const { vaultId } = z.object({ vaultId: z.string() }).parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const notes = await scanVault(vault)
    const summaries: NoteSummary[] = notes.map((n) => {
      const slash = n.relativePath.lastIndexOf('/')
      const isKindle = isKindleNote(n.frontmatter)
      return {
        title: n.title,
        relativePath: n.relativePath,
        dir: slash >= 0 ? n.relativePath.slice(0, slash) : '',
        isKindle,
        highlightsCount: isKindle ? parseKindleNote(n).highlights.length : null,
      }
    })
    return { data: summaries }
  })

  const splitRequestSchema = z.object({
    vaultId: z.string(),
    notePath: z.string(),
    options: kindleSplitOptionsSchema,
  })

  /** Generate the split notes in memory (no writes) for the preview pager. */
  fastify.post('/notes/kindle-split/preview', async (request, reply) => {
    const { vaultId, notePath, options } = splitRequestSchema.parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const notes = await scanVault(vault)
    const note = notes.find((n) => n.relativePath === notePath)
    if (!note) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Note not found' } })
      return
    }
    if (!isKindleNote(note.frontmatter)) {
      reply.code(400).send({ error: { code: 'NOT_KINDLE', message: 'Not a Kindle highlights note' } })
      return
    }
    return { data: buildSplitNotes(note, options, vault.properties) }
  })

  /** Write the split notes to disk (optionally deleting the original). Collision-safe + revertable. */
  fastify.post('/notes/kindle-split/apply', async (request, reply) => {
    const { vaultId, notePath, options } = splitRequestSchema.parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const notes = await scanVault(vault)
    const note = notes.find((n) => n.relativePath === notePath)
    if (!note) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Note not found' } })
      return
    }
    // Only existing folders are allowed (mirrors the folder picker's contract).
    const dirOk = await stat(join(vault.path, options.targetDir))
      .then((s) => s.isDirectory())
      .catch(() => false)
    if (!dirOk) {
      reply.code(400).send({ error: { code: 'BAD_TARGET', message: 'Target folder does not exist' } })
      return
    }
    try {
      const result = await applyKindleSplit(vault.path, note, options, vault.properties)
      invalidateCache(vaultId)
      return { data: result }
    } catch (err) {
      if (err instanceof KindleSplitError) {
        const code = err.code === 'COLLISION' ? 409 : 400
        reply.code(code).send({ error: { code: err.code, message: err.message } })
        return
      }
      throw err
    }
  })

  /** Undo an applied split: remove the created (untracked) notes, optionally reset tracked files. */
  fastify.post('/notes/kindle-split/revert', async (request, reply) => {
    const { vaultId, createdPaths, resetToHead } = z
      .object({
        vaultId: z.string(),
        createdPaths: z.array(z.string()),
        resetToHead: z.boolean().default(false),
      })
      .parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    await revertKindleSplit(vault.path, createdPaths, resetToHead)
    invalidateCache(vaultId)
    return { data: { ok: true } }
  })
}
