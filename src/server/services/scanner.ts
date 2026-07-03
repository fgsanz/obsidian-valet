import { readdir, readFile } from 'fs/promises'
import { join, relative, extname } from 'path'
import type { Vault, ParsedNote, PropertyDef, PropertyType } from '@shared/types'
import { parseNote, extractFrontmatter, inferType } from './frontmatter'

interface CacheEntry {
  notes: ParsedNote[]
  scannedAt: number
}

const cache = new Map<string, CacheEntry>()

function normalizeForbiddenDirs(dirs: string[]): string[] {
  return dirs
    .map((d) => d.replace(/^\/+|\/+$/g, ''))
    .filter((d) => d.length > 0)
}

function isForbiddenDirectory(dirRel: string, forbiddenDirs: string[]): boolean {
  return forbiddenDirs.some((forbidden) => dirRel === forbidden || dirRel.startsWith(forbidden + '/'))
}

export function invalidateCache(vaultId: string): void {
  cache.delete(vaultId)
}

export function getCachedNotes(vaultId: string): ParsedNote[] | null {
  return cache.get(vaultId)?.notes ?? null
}

export async function collectFiles(
  dir: string,
  forbiddenDirs: string[],
  out: string[],
  rel: string = '',
): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (isForbiddenDirectory(entryRel, forbiddenDirs)) continue
      await collectFiles(full, forbiddenDirs, out, entryRel)
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
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dirRel = rel ? `${rel}/${entry.name}` : entry.name
    dirs.push(dirRel)
    const children = await collectDirectories(base, dirRel, depth + 1)
    dirs.push(...children)
  }
  return dirs
}

export async function scanVault(vault: Vault): Promise<ParsedNote[]> {
  const forbidden = normalizeForbiddenDirs(vault.forbiddenDirs)
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

/**
 * Obsidian records the type a user assigns to a property (its Properties UI) in
 * `<vault>/.obsidian/types.json`. Its type keywords are coarser than ours, so we only map the ones
 * that are unambiguous — and deliberately skip `text`/`multitext`, because our own inference
 * distinguishes link / tag / date sub-kinds that Obsidian lumps together.
 */
const OBSIDIAN_TYPE_MAP: Record<string, PropertyType> = {
  checkbox: 'boolean',
  number: 'number',
  date: 'date',
  datetime: 'date',
  tags: 'tag-array',
  aliases: 'text-array',
}

/**
 * Read `<vault>/.obsidian/types.json` and return the property → type overrides it declares. Returns
 * an empty map when the file is missing, unreadable, or invalid — so callers fall back to inference.
 */
export async function readObsidianTypes(vaultPath: string): Promise<Map<string, PropertyType>> {
  const map = new Map<string, PropertyType>()
  try {
    const raw = await readFile(join(vaultPath, '.obsidian', 'types.json'), 'utf-8')
    const parsed = JSON.parse(raw) as { types?: Record<string, string> }
    for (const [name, obsType] of Object.entries(parsed.types ?? {})) {
      const mapped = OBSIDIAN_TYPE_MAP[obsType]
      if (mapped) map.set(name, mapped)
    }
  } catch {
    // No types.json (or invalid) — inference alone decides the types.
  }
  return map
}

export async function discoverProperties(vault: Vault): Promise<PropertyDef[]> {
  const forbidden = normalizeForbiddenDirs(vault.forbiddenDirs)
  const files: string[] = []
  await collectFiles(vault.path, forbidden, files)

  // Explicit types the user assigned in Obsidian take precedence over inferred ones.
  const declaredTypes = await readObsidianTypes(vault.path)

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

  // Pick most-voted type per property (unless Obsidian declares one), sort by total count (desc).
  const props: PropertyDef[] = []
  for (const [name, typeVotes] of votes) {
    const inferred = [...typeVotes.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const type = declaredTypes.get(name) ?? inferred
    props.push({ name, type })
  }

  const total = (name: string) =>
    [...(votes.get(name)?.values() ?? [])].reduce((s, n) => s + n, 0)

  return props.sort((a, b) => total(b.name) - total(a.name))
}
