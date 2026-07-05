import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isKindleNote, parseKindleNote, buildSplitNotes } from '../../src/server/services/kindle'
import { parseNote, createNote } from '../../src/server/services/frontmatter'
import type { KindleSplitOptions, PropertyDef } from '@shared/types'

const DEFS: PropertyDef[] = [
  { name: 'kindle-bookId', type: 'text' },
  { name: 'kindle-highlightsCount', type: 'number' },
  { name: 'people', type: 'link-array' },
  { name: 'category', type: 'text' },
  { name: 'source', type: 'link-array' },
]

// The Kindle fixture lives in a folder with tricky unicode in its name; find it by filename suffix
// rather than hard-coding the path.
const vaultRoot = fileURLToPath(new URL('../fixtures/test-vault/', import.meta.url))
function findFixture(): string {
  const stack = [vaultRoot]
  while (stack.length) {
    const dir = stack.pop()!
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) stack.push(p)
      else if (entry.name.endsWith('Kindle highlights.md')) return p
    }
  }
  throw new Error('Kindle highlights fixture not found under ' + vaultRoot)
}
const KINDLE_FIXTURE = readFileSync(findFixture(), 'utf-8')

function kindleNote() {
  return parseNote(
    '/v/Agile Estimating and Planning - Kindle highlights.md',
    'Agile Estimating and Planning - Kindle highlights.md',
    KINDLE_FIXTURE,
    DEFS,
  )
}

function opts(over: Partial<KindleSplitOptions> = {}): KindleSplitOptions {
  return {
    prefix: 'Agile Estimating and Planning - Kindle highlights',
    startNumber: 1,
    targetDir: 'Books – Kindle highlights',
    properties: [],
    deleteOriginal: false,
    ...over,
  }
}

// ── isKindleNote ────────────────────────────────────────────────────────────

test('isKindleNote: true when any kindle-* property is present', () => {
  assert.equal(isKindleNote({ 'kindle-asin': 'B00' }), true)
  assert.equal(isKindleNote({ 'kindle-bookId': '1', title: 'z' }), true)
})

test('isKindleNote: false for a normal note', () => {
  assert.equal(isKindleNote({ title: 'z', tags: ['a'] }), false)
  assert.equal(isKindleNote({}), false)
})

// ── parseKindleNote ─────────────────────────────────────────────────────────

test('parseKindleNote: extracts 187 highlights and the metadata block from the fixture', () => {
  const { metadata, highlights } = parseKindleNote(kindleNote())
  assert.equal(highlights.length, 187)
  // Verbatim: keeps the location line and the ^ref anchor.
  assert.match(highlights[0], /^As we discover these things/)
  assert.match(highlights[0], /\^ref-30350$/)
  assert.equal(metadata.author, '[Mike Cohn](https://www.amazon.comundefined)')
  assert.equal(metadata.asin, 'B004X1D3TC')
  assert.equal(metadata.reference, 'https://www.amazon.com/dp/B004X1D3TC')
  assert.equal(metadata.kindleLink, '[Kindle link](kindle://book?action=open&asin=B004X1D3TC)')
})

test('parseKindleNote: a single highlight with no --- rule yields one highlight', () => {
  const body = '# Title\n## Metadata\n* ASIN: X\n\n## Highlights\nOnly one highlight.'
  const note = parseNote('/v/n.md', 'n.md', `---\nkindle-asin: X\n---\n${body}`, DEFS)
  assert.deepEqual(parseKindleNote(note).highlights, ['Only one highlight.'])
})

test('parseKindleNote: tolerates a trailing --- rule (no empty final highlight)', () => {
  const body = '## Highlights\nfirst\n\n---\nsecond\n\n---\n'
  const note = parseNote('/v/n.md', 'n.md', `---\nkindle-asin: X\n---\n${body}`, DEFS)
  assert.deepEqual(parseKindleNote(note).highlights, ['first', 'second'])
})

// ── buildSplitNotes ─────────────────────────────────────────────────────────

test('buildSplitNotes: one note per highlight, zero-padded to the highlightsCount width', () => {
  const notes = buildSplitNotes(kindleNote(), opts(), DEFS)
  assert.equal(notes.length, 187)
  assert.equal(notes[0].name, 'Agile Estimating and Planning - Kindle highlights — 001')
  assert.equal(notes[0].fileName, 'Agile Estimating and Planning - Kindle highlights — 001.md')
  assert.equal(notes[186].name, 'Agile Estimating and Planning - Kindle highlights — 187')
})

test('buildSplitNotes: honours the start number', () => {
  const notes = buildSplitNotes(kindleNote(), opts({ startNumber: 5 }), DEFS)
  assert.equal(notes[0].name.endsWith('— 005'), true)
  assert.equal(notes[186].name.endsWith('— 191'), true)
})

test('buildSplitNotes: preserves original frontmatter verbatim and appends props + source', () => {
  const notes = buildSplitNotes(kindleNote(), opts({ properties: [{ name: 'category', value: 'Highlight' }] }), DEFS)
  const c = notes[0].content
  assert.match(c, /kindle-bookId: "49452"/) // verbatim — still a quoted string
  assert.match(c, /people:\n {2}- "\[\[Mike Cohn\]\]"/)
  assert.match(c, /\ncategory: Highlight\n/)
  assert.match(c, /source:\n {2}- "\[\[Agile Estimating and Planning - Kindle highlights\]\]"/)
  assert.match(c, /\n# Metadata\n- Name: Agile Estimating and Planning - Kindle highlights\n/)
  assert.match(c, /\n# Highlight 001\n\nAs we discover these things/)
})

test('buildSplitNotes: no injected source when the user added a source property', () => {
  const notes = buildSplitNotes(kindleNote(), opts({ properties: [{ name: 'source', value: '[[Somewhere else]]' }] }), DEFS)
  const sourceLines = (notes[0].content.match(/^source:/gm) ?? []).length
  assert.equal(sourceLines, 1)
})

test('buildSplitNotes: no source when a property already links back to the original note', () => {
  const notes = buildSplitNotes(
    kindleNote(),
    opts({ properties: [{ name: 'related', value: '[[Agile Estimating and Planning - Kindle highlights]]' }] }),
    DEFS,
  )
  assert.equal(/^source:/m.test(notes[0].content), false)
})

test('buildSplitNotes: a non-Kindle note produces no split notes', () => {
  const plain = parseNote('/v/Plain.md', 'Plain.md', '---\ntitle: x\n---\n# Plain\nsome text', DEFS)
  assert.equal(buildSplitNotes(plain, opts(), DEFS).length, 0)
})

// ── createNote helper ───────────────────────────────────────────────────────

test('createNote: writes a new file (creating dirs) and refuses to overwrite', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ov-kindle-'))
  const fp = join(dir, 'sub', 'Note.md')
  await createNote(fp, 'hello')
  assert.equal(readFileSync(fp, 'utf-8'), 'hello')
  await assert.rejects(() => createNote(fp, 'again'), /already exists/)
  await createNote(fp, 'overwritten', true)
  assert.equal(readFileSync(fp, 'utf-8'), 'overwritten')
})
