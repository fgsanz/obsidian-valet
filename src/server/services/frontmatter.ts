import yaml from 'js-yaml'
import { writeFile, rename } from 'fs/promises'
import { tmpdir } from 'os'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'
import type { ParsedNote, PropertyDef, PropertyType } from '@shared/types'

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function extractFrontmatter(content: string): {
  raw: string
  data: Record<string, unknown>
  body: string
} | null {
  const match = content.match(FRONTMATTER_RE)
  if (!match) return null
  try {
    const data = (yaml.load(match[1], { schema: yaml.CORE_SCHEMA }) ?? {}) as Record<
      string,
      unknown
    >
    return { raw: match[1], data, body: match[2] }
  } catch {
    return null
  }
}

export function inferType(key: string, value: unknown): PropertyType {
  // `tags` is a built-in Obsidian property and is always an array of tags, regardless of how
  // the values happen to be written (Obsidian stores them in frontmatter without a leading #).
  if (key === 'tags') return 'tag-array'

  if (Array.isArray(value)) {
    const first = value[0]
    if (typeof first === 'string') {
      if (first.startsWith('#')) return 'tag-array'
      if (/^\[\[/.test(first)) return 'link-array'
      return 'text-array'
    }
    return 'text-array'
  }
  if (typeof value === 'string') {
    if (/^\[\[/.test(value)) {
      if (/\[\[\d{4}-W\d{1,2}\]\]/.test(value)) return 'week-link'
      return 'link'
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    if (value.startsWith('#')) return 'tag-array'
  }
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'text'
}

function resolveType(key: string, value: unknown, defs: PropertyDef[]): PropertyType {
  const def = defs.find((d) => d.name === key)
  return def ? def.type : inferType(key, value)
}

function normalizeValue(value: unknown, type: PropertyType): unknown {
  switch (type) {
    case 'tag-array': {
      const arr = Array.isArray(value) ? value : [value]
      return arr.map((v) => String(v).replace(/^#/, ''))
    }
    case 'text-array':
      return Array.isArray(value) ? value.map(String) : value != null ? [String(value)] : []
    case 'link-array':
      return Array.isArray(value) ? value.map(String) : value != null ? [String(value)] : []
    case 'link':
    case 'week-link':
    case 'text':
    case 'date':
      return value != null ? String(value) : null
    case 'number':
      return value != null ? Number(value) : null
    case 'boolean':
      return Boolean(value)
    default:
      return value
  }
}

export function parseNote(
  filePath: string,
  relativePath: string,
  content: string,
  defs: PropertyDef[],
): ParsedNote {
  const parsed = extractFrontmatter(content)
  if (!parsed) {
    return {
      filePath,
      relativePath,
      title: basename(filePath, '.md'),
      frontmatter: {},
      rawFrontmatter: '',
      body: content,
    }
  }

  const frontmatter: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(parsed.data)) {
    const type = resolveType(key, raw, defs)
    frontmatter[key] = normalizeValue(raw, type)
  }

  return {
    filePath,
    relativePath,
    title: String(frontmatter['title'] ?? basename(filePath, '.md')),
    frontmatter,
    rawFrontmatter: parsed.raw,
    body: parsed.body,
  }
}

function serializeValue(value: unknown, type: PropertyType): unknown {
  if (value == null) return null
  switch (type) {
    case 'tag-array': {
      const arr = Array.isArray(value) ? value : [value]
      return arr.map((v) => `#${v}`)
    }
    case 'link-array':
    case 'text-array':
      return Array.isArray(value) ? value : [value]
    default:
      return value
  }
}

export async function writeNote(note: ParsedNote, defs: PropertyDef[]): Promise<void> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(note.frontmatter)) {
    const type = resolveType(key, value, defs)
    obj[key] = serializeValue(value, type)
  }

  const yamlStr = yaml.dump(obj, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
    schema: yaml.CORE_SCHEMA,
  })

  const newContent = `---\n${yamlStr}---\n${note.body}`
  const tmp = join(tmpdir(), `ov-${randomUUID()}.tmp`)
  await writeFile(tmp, newContent, 'utf-8')
  await rename(tmp, note.filePath)
}

/**
 * A property value counts as empty when it is null/undefined, a blank string, or an empty array.
 * The single source of truth shared by filtering (exists-and-empty / exists-and-not-empty) and
 * by operations (add-value into a single-value property). Property *presence* is a separate
 * concept — a property can exist in the frontmatter and still hold an empty value.
 */
export function isEmptyPropertyValue(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  )
}

export function normalizeLinkTarget(value: string): string {
  return value
    .replace(/^\[\[/, '')
    .replace(/\]\]$/, '')
    .split('|')[0]
    .trim()
    .toLowerCase()
}
