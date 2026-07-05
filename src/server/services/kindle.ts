import yaml from 'js-yaml'
import { serializeValue, normalizeLinkTarget } from './frontmatter'
import { resolvePropertyType } from '@shared/properties'
import type {
  ParsedNote,
  PropertyDef,
  PropertyType,
  KindleMetadata,
  ParsedKindleNote,
  KindleSplitOptions,
  SplitNote,
} from '@shared/types'

const KINDLE_PREFIX = 'kindle-'

/** A note is a Kindle-highlights note when it has at least one `kindle-*` frontmatter property. */
export function isKindleNote(frontmatter: Record<string, unknown>): boolean {
  return Object.keys(frontmatter).some((key) => key.startsWith(KINDLE_PREFIX))
}

/**
 * Parse a Kindle-highlights note body into its `## Metadata` block and the list of individual
 * highlights. Highlights live under the `## Highlights` heading, each separated from the next by a
 * `---` horizontal rule. Frontmatter is already stripped from `note.body` by `parseNote`.
 */
export function parseKindleNote(note: ParsedNote): ParsedKindleNote {
  const lines = note.body.split('\n')
  const metaIdx = lines.findIndex((l) => /^##\s+Metadata\s*$/i.test(l))
  const highlightsIdx = lines.findIndex((l) => /^##\s+Highlights\s*$/i.test(l))

  // Metadata block = the lines between `## Metadata` and `## Highlights`.
  const metaStart = metaIdx >= 0 ? metaIdx + 1 : 0
  const metaEnd = highlightsIdx >= 0 ? highlightsIdx : metaStart
  const metadata = parseMetadataBlock(lines.slice(metaStart, metaEnd))

  // Highlights = everything after `## Highlights`, split on standalone `---` rules. A trailing rule
  // produces an empty final chunk, which the blank filter drops.
  const region = highlightsIdx >= 0 ? lines.slice(highlightsIdx + 1).join('\n') : ''
  const highlights = region
    .split(/^\s*---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)

  return { metadata, highlights }
}

/** Extract Author / ASIN / Reference / Kindle link from the `## Metadata` bullet lines, leniently. */
function parseMetadataBlock(lines: string[]): KindleMetadata {
  const meta: KindleMetadata = {}
  for (const raw of lines) {
    const line = raw.replace(/^\s*[-*+]\s+/, '').trim()
    if (!line) continue
    const author = line.match(/^Author:\s*(.*)$/i)
    if (author) {
      meta.author = author[1].trim()
      continue
    }
    const asin = line.match(/^ASIN:\s*(.*)$/i)
    if (asin) {
      meta.asin = asin[1].trim()
      continue
    }
    const reference = line.match(/^Reference:\s*(.*)$/i)
    if (reference) {
      meta.reference = reference[1].trim()
      continue
    }
    if (/\[Kindle link\]/i.test(line)) meta.kindleLink = line
  }
  return meta
}

/**
 * Build every split note for a Kindle-highlights note — one note per highlight — following the
 * agreed template: the original frontmatter is preserved verbatim, the user's extra properties are
 * appended, a `source` backlink is added unless the user already linked back, then a `# Metadata`
 * block and a single `# Highlight NNN` section. Pure: it computes content only and writes nothing.
 * A note with no highlights (e.g. not a Kindle note) yields an empty list.
 */
export function buildSplitNotes(
  note: ParsedNote,
  options: KindleSplitOptions,
  defs: PropertyDef[],
): SplitNote[] {
  const { metadata, highlights } = parseKindleNote(note)
  if (highlights.length === 0) return []

  const start = options.startNumber ?? 1
  const last = start + highlights.length - 1
  // Zero-pad to the digit width of `kindle-highlightsCount` (falling back to the real counts), so
  // 187 highlights number 001…187.
  const declared = Number(note.frontmatter['kindle-highlightsCount'])
  const width = Math.max(
    String(Number.isFinite(declared) ? Math.trunc(declared) : 0).length,
    String(last).length,
  )
  const pad = (n: number) => String(n).padStart(width, '0')

  const extraFrontmatter = buildExtraFrontmatter(note, options, defs)
  const frontmatter = extraFrontmatter
    ? `${note.rawFrontmatter}\n${extraFrontmatter}`
    : note.rawFrontmatter
  const metadataBlock = buildMetadataBlock(note.title, metadata)

  return highlights.map((text, i) => {
    const index = start + i
    const name = `${options.prefix} — ${pad(index)}`
    const content = `---\n${frontmatter}\n---\n${metadataBlock}\n\n# Highlight ${pad(index)}\n\n${text}\n`
    return { index, name, fileName: `${name}.md`, content }
  })
}

/** The extra YAML lines appended after the original frontmatter (user props + `source` backlink). */
function buildExtraFrontmatter(
  note: ParsedNote,
  options: KindleSplitOptions,
  defs: PropertyDef[],
): string {
  const lines: string[] = []
  for (const prop of options.properties) {
    if (!prop.name) continue
    lines.push(propertyToYaml(prop.name, prop.value, resolvePropertyType(prop.name, defs)))
  }
  if (!userLinkedBackToOriginal(note, options)) {
    lines.push(propertyToYaml('source', `[[${note.title}]]`, 'link-array'))
  }
  return lines.join('\n')
}

/** True when the user already added a `source` property or a property that links to the original. */
function userLinkedBackToOriginal(note: ParsedNote, options: KindleSplitOptions): boolean {
  const target = normalizeLinkTarget(note.title)
  return options.properties.some(
    (prop) =>
      prop.name === 'source' ||
      (/\[\[/.test(prop.value) && normalizeLinkTarget(prop.value) === target),
  )
}

/** Serialize a single frontmatter entry to a YAML line, type-aware (e.g. link-array → a list item). */
function propertyToYaml(name: string, value: string, type: PropertyType): string {
  const obj = { [name]: serializeValue(value, type) }
  return yaml
    .dump(obj, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
      noRefs: true,
      schema: yaml.CORE_SCHEMA,
    })
    .trimEnd()
}

/** The `# Metadata` block shared by every split note. */
function buildMetadataBlock(originalName: string, meta: KindleMetadata): string {
  const lines = ['# Metadata', `- Name: ${originalName}`]
  if (meta.author) lines.push(`- Author: ${meta.author}`)
  if (meta.asin) lines.push(`- ASIN: ${meta.asin}`)
  if (meta.reference) lines.push(`- Reference: ${meta.reference}`)
  if (meta.kindleLink) lines.push(`- ${meta.kindleLink}`)
  return lines.join('\n')
}
