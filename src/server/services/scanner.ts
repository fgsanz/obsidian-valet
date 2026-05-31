import { readdir, readFile } from 'fs/promises'
import { join, relative, extname } from 'path'
import type { Vault, ParsedNote, PropertyDef, PropertyType } from '@shared/types'
import { parseNote, extractFrontmatter, inferType } from './frontmatter'

interface CacheEntry {
  notes: ParsedNote[]
  scannedAt: number
}

const cache = new Map<string, CacheEntry>()

export function invalidateCache(vaultId: string): void {
  cache.delete(vaultId)
}

export function getCachedNotes(vaultId: string): ParsedNote[] | null {
  return cache.get(vaultId)?.notes ?? null
}

export async function collectFiles(dir: string, forbidden: Set<string>, out: string[]): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (forbidden.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(full, forbidden, out)
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      out.push(full)
    }
  }
}

export async function collectDirectories(
  base: string,
  rel: string = '',
  depth: number = 0,
): Promise<string[]> {
  if (depth > 4) return []
  const full = rel ? join(base, rel) : base
  let entries
  try {
    entries = await readdir(full, { withFileTypes: true })
  } catch {
    return []
  }
  const dirs: string[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirRel = rel ? `${rel}/${entry.name}` : entry.name
    dirs.push(dirRel)
    const children = await collectDirectories(base, dirRel, depth + 1)
    dirs.push(...children)
  }
  return dirs
}

export async function scanVault(vault: Vault): Promise<ParsedNote[]> {
  const forbidden = new Set(vault.forbiddenDirs.map((d) => d.replace(/^\//, '')))
  const files: string[] = []
  await collectFiles(vault.path, forbidden, files)

  const notes: ParsedNote[] = []
  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf-8')
      const relativePath = relative(vault.path, filePath)
      const note = parseNote(filePath, relativePath, content, vault.properties)
      notes.push(note)
    } catch {
      // skip unreadable files
    }
  }

  cache.set(vault.id, { notes, scannedAt: Date.now() })
  return notes
}

export async function discoverProperties(vault: Vault): Promise<PropertyDef[]> {
  const forbidden = new Set(vault.forbiddenDirs.map((d) => d.replace(/^\//, '')))
  const files: string[] = []
  await collectFiles(vault.path, forbidden, files)

  // Track type votes: propName → Map<type, count>
  const votes = new Map<string, Map<PropertyType, number>>()

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, 'utf-8')
      const parsed = extractFrontmatter(content)
      if (!parsed) continue
      for (const [key, value] of Object.entries(parsed.data)) {
        if (!votes.has(key)) votes.set(key, new Map())
        const type = inferType(key, value)
        const m = votes.get(key)!
        m.set(type, (m.get(type) ?? 0) + 1)
      }
    } catch {
      // skip
    }
  }

  // Pick most-voted type per property, sort by total occurrence count (descending)
  const props: PropertyDef[] = []
  for (const [name, typeVotes] of votes) {
    const type = [...typeVotes.entries()].sort((a, b) => b[1] - a[1])[0][0]
    props.push({ name, type })
  }

  const total = (name: string) =>
    [...(votes.get(name)?.values() ?? [])].reduce((s, n) => s + n, 0)

  return props.sort((a, b) => total(b.name) - total(a.name))
}
