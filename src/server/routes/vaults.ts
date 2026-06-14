import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { homedir } from 'os'
import { stat } from 'fs/promises'
import { z } from 'zod'
import { getConfig, updateConfig } from '../config/config'
import { getSettings, updateSettings } from '../config/settings'
import { forgetVault } from '@shared/settings'
import { createVaultSchema } from '@shared/schemas'
import type { Vault } from '@shared/types'
import { collectDirectories, discoverProperties } from '../services/scanner'
import { getGitStatus } from '../services/git'

const execAsync = promisify(exec)

function expandPath(p: string): string {
  return p.startsWith('~') ? p.replace(/^~/, homedir()) : p
}

export const vaultsPlugin: FastifyPluginAsync = async (fastify) => {
  // ── Vault CRUD ─────────────────────────────────────────────────────────────

  fastify.get('/vaults', async () => {
    const config = await getConfig()
    return { data: config.vaults }
  })

  fastify.get('/vaults/active', async () => {
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === config.activeVaultId) ?? null
    return { data: vault }
  })

  fastify.put('/vaults/active', async (request, reply) => {
    const { vaultId } = z.object({ vaultId: z.string() }).parse(request.body)
    const config = await getConfig()
    if (!config.vaults.find((v) => v.id === vaultId)) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    await updateConfig((c) => ({ ...c, activeVaultId: vaultId }))
    return { data: null }
  })

  fastify.post('/vaults', async (request, reply) => {
    const body = createVaultSchema.parse(request.body)
    const vault: Vault = { id: randomUUID(), ...body }
    await updateConfig((c) => ({
      ...c,
      vaults: [...c.vaults, vault],
      // Auto-activate if this is the first vault
      activeVaultId: c.vaults.length === 0 ? vault.id : c.activeVaultId,
    }))
    reply.code(201)
    return { data: vault }
  })

  fastify.patch('/vaults/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const patchSchema = z.object({
      name: z.string().min(1).optional(),
      path: z.string().min(1).optional(),
      forbiddenDirs: z.array(z.string()).optional(),
    })
    const body = patchSchema.parse(request.body)

    const config = await getConfig()
    const idx = config.vaults.findIndex((v) => v.id === id)
    if (idx === -1) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }

    let updated: Vault | undefined
    await updateConfig((c) => {
      const vaults = [...c.vaults]
      updated = { ...vaults[idx], ...body }
      vaults[idx] = updated
      return { ...c, vaults }
    })
    return { data: updated }
  })

  fastify.delete('/vaults/:id', async (request) => {
    const { id } = request.params as { id: string }
    await updateConfig((c) => ({
      ...c,
      vaults: c.vaults.filter((v) => v.id !== id),
      activeVaultId: c.activeVaultId === id ? null : c.activeVaultId,
    }))
    // Also drop any per-vault settings so the deleted vault leaves nothing orphaned behind.
    const settings = await getSettings()
    await updateSettings(forgetVault(settings, id))
    return { data: null }
  })

  // ── Path validity ───────────────────────────────────────────────────────────
  // A vault's folder may be moved/renamed/deleted outside this tool. Report which
  // configured vaults still point at an existing directory so the UI can flag them.

  fastify.get('/vaults/path-status', async () => {
    const config = await getConfig()
    const entries = await Promise.all(
      config.vaults.map(async (v) => {
        try {
          const info = await stat(expandPath(v.path))
          return [v.id, info.isDirectory()] as const
        } catch {
          return [v.id, false] as const
        }
      }),
    )
    return { data: Object.fromEntries(entries) as Record<string, boolean> }
  })

  // ── Git availability ──────────────────────────────────────────────────────────
  // Report which configured vaults contain a git repo, so the UI can show a "Git ready" badge.

  fastify.get('/vaults/git-status', async () => {
    const config = await getConfig()
    const entries = await Promise.all(
      config.vaults.map(async (v) => {
        try {
          const status = await getGitStatus(expandPath(v.path))
          return [v.id, status.hasGit] as const
        } catch {
          return [v.id, false] as const
        }
      }),
    )
    return { data: Object.fromEntries(entries) as Record<string, boolean> }
  })

  // ── Property discovery ──────────────────────────────────────────────────────

  fastify.post('/vaults/:id/discover-properties', async (request, reply) => {
    const { id } = request.params as { id: string }
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === id)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }

    const properties = await discoverProperties(vault)

    await updateConfig((c) => {
      const idx = c.vaults.findIndex((v) => v.id === id)
      if (idx === -1) return c
      const vaults = [...c.vaults]
      vaults[idx] = { ...vaults[idx], properties }
      return { ...c, vaults }
    })

    return { data: properties }
  })

  // ── Vault directory listing (for filter autocomplete) ──────────────────────

  fastify.get('/vaults/:id/directories', async (request, reply) => {
    const { id } = request.params as { id: string }
    const config = await getConfig()
    const vault = config.vaults.find((v) => v.id === id)
    if (!vault) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vault not found' } })
      return
    }
    const allDirs = await collectDirectories(vault.path)
    const dirs = allDirs.filter((d) => {
      for (const forbidden of vault.forbiddenDirs) {
        if (d === forbidden || d.startsWith(forbidden + '/')) {
          return false
        }
      }
      return true
    })
    return { data: dirs.sort() }
  })

  // ── Filesystem utilities (for vault setup UI) ───────────────────────────────

  fastify.post('/browse-folder', async (_request, reply) => {
    try {
      const { stdout } = await execAsync(
        `osascript -e 'POSIX path of (choose folder with prompt "Select Obsidian vault folder")'`,
        { timeout: 120_000 },
      )
      const path = stdout.trim().replace(/\/$/, '')
      return { data: { path } }
    } catch {
      // User cancelled or not macOS
      return { data: { path: null } }
    }
  })

  fastify.post('/list-directories', async (request) => {
    const { path } = z.object({ path: z.string() }).parse(request.body)
    const expanded = expandPath(path)
    const dirs = await collectDirectories(expanded)
    return { data: dirs.sort() }
  })
}
