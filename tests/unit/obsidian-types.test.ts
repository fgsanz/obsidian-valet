import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readObsidianTypes, discoverProperties } from '../../src/server/services/scanner'
import type { Vault } from '../../src/shared/types'

let dir: string | null = null

async function makeVault(files: Record<string, string>, types?: Record<string, string>): Promise<Vault> {
  dir = await mkdtemp(join(tmpdir(), 'ov-types-'))
  for (const [rel, content] of Object.entries(files)) {
    await writeFile(join(dir, rel), content, 'utf-8')
  }
  if (types) {
    await mkdir(join(dir, '.obsidian'), { recursive: true })
    await writeFile(join(dir, '.obsidian', 'types.json'), JSON.stringify({ types }), 'utf-8')
  }
  return { id: 'v1', name: 'V', path: dir, forbiddenDirs: [], properties: [] }
}

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
  dir = null
})

test('readObsidianTypes maps known Obsidian keywords, skips text/multitext and unknowns', async () => {
  const vault = await makeVault({}, {
    read: 'checkbox',
    pages: 'number',
    due: 'date',
    seen: 'datetime',
    note: 'text',
    related: 'multitext',
    weird: 'somethingelse',
  })
  const map = await readObsidianTypes(vault.path)
  assert.equal(map.get('read'), 'boolean')
  assert.equal(map.get('pages'), 'number')
  assert.equal(map.get('due'), 'date')
  assert.equal(map.get('seen'), 'date') // datetime → date
  assert.equal(map.has('note'), false) // text left to inference
  assert.equal(map.has('related'), false) // multitext left to inference
  assert.equal(map.has('weird'), false) // unknown keyword ignored
})

test('readObsidianTypes returns an empty map when there is no types.json', async () => {
  const vault = await makeVault({ 'Note.md': '---\nread: true\n---\nBody\n' })
  const map = await readObsidianTypes(vault.path)
  assert.equal(map.size, 0)
})

test('discoverProperties honors an Obsidian checkbox type even when the value is empty', async () => {
  // With an empty value, inference alone would call `read` text; types.json makes it boolean.
  const vault = await makeVault({ 'Note.md': '---\nread:\n---\nBody\n' }, { read: 'checkbox' })
  const props = await discoverProperties(vault)
  assert.equal(props.find((p) => p.name === 'read')?.type, 'boolean')
})

test('discoverProperties falls back to inference without types.json', async () => {
  const vault = await makeVault({ 'Note.md': '---\ncount: 3\n---\nBody\n' })
  const props = await discoverProperties(vault)
  assert.equal(props.find((p) => p.name === 'count')?.type, 'number')
})

test('an Obsidian-declared type overrides a conflicting inferred one', async () => {
  // The value looks like plain text, but the user declared it a checkbox in Obsidian.
  const vault = await makeVault({ 'Note.md': '---\nread: false\n---\nBody\n' }, { read: 'checkbox' })
  const props = await discoverProperties(vault)
  assert.equal(props.find((p) => p.name === 'read')?.type, 'boolean')
})
