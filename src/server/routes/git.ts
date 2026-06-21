import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getConfig } from '../config/config'
import { getGitStatus, commitAll, suggestCommitMessage, revertToHead } from '../services/git'
import { invalidateCache } from '../services/scanner'

export const gitPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/git/:vaultId/status', async (request, reply) => {
    const { vaultId } = request.params as { vaultId: string }
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const status = await getGitStatus(vault.path)
    return { data: status }
  })

  fastify.get('/git/:vaultId/suggest-message', async (request, reply) => {
    const { vaultId } = request.params as { vaultId: string }
    const { context } = z
      .object({ context: z.string().default('operation') })
      .parse(request.query)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    return { data: { message: suggestCommitMessage(context) } }
  })

  fastify.post('/git/:vaultId/commit', async (request, reply) => {
    const { vaultId } = request.params as { vaultId: string }
    const { message, allowEmpty } = z
      .object({ message: z.string().min(1), allowEmpty: z.boolean().optional() })
      .parse(request.body)
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    try {
      const sha = await commitAll(vault.path, message, allowEmpty)
      return { data: { sha } }
    } catch (err) {
      const msg = String(err)
      if (msg.includes('nothing to commit') || msg.includes('nothing added to commit')) {
        reply.code(409).send({ error: { code: 'NOTHING_TO_COMMIT', message: 'Nothing to commit' } })
        return
      }
      throw err
    }
  })

  fastify.post('/git/:vaultId/revert', async (request, reply) => {
    const { vaultId } = request.params as { vaultId: string }
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === vaultId)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    await revertToHead(vault.path)
    invalidateCache(vaultId)
    return { data: { ok: true } }
  })
}
