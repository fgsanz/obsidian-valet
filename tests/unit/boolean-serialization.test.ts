import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeNote } from '../../src/server/services/frontmatter'
import type { ParsedNote, PropertyDef } from '../../src/shared/types'

// Typed schema for the property under test.
const defs: PropertyDef[] = [
  { name: 'read', type: 'boolean' },
  { name: 'pages', type: 'number' },
]

let tmp: string | null = null

/** Write a note whose frontmatter is exactly `frontmatter`, then return the raw file contents. */
async function writeAndRead(frontmatter: Record<string, unknown>): Promise<string> {
  tmp = await mkdtemp(join(tmpdir(), 'ov-bool-'))
  const filePath = join(tmp, 'Note.md')
  const note: ParsedNote = {
    filePath,
    relativePath: 'Note.md',
    title: 'Note',
    frontmatter,
    rawFrontmatter: '',
    body: 'Body\n',
  }
  await writeNote(note, defs)
  return readFile(filePath, 'utf-8')
}

afterEach(async () => {
  if (tmp) await rm(tmp, { recursive: true, force: true })
  tmp = null
})

test('boolean set to the string "false" is written unquoted (read: false)', async () => {
  const content = await writeAndRead({ read: 'false' })
  assert.match(content, /^read: false$/m)
  assert.doesNotMatch(content, /read: "false"/)
})

test('boolean set to the string "true" is written unquoted (read: true)', async () => {
  const content = await writeAndRead({ read: 'true' })
  assert.match(content, /^read: true$/m)
  assert.doesNotMatch(content, /read: "true"/)
})

test('a real boolean value is preserved unquoted', async () => {
  const content = await writeAndRead({ read: false })
  assert.match(content, /^read: false$/m)
})

test('number set to the string "42" is written unquoted (pages: 42)', async () => {
  const content = await writeAndRead({ pages: '42' })
  assert.match(content, /^pages: 42$/m)
  assert.doesNotMatch(content, /pages: "42"/)
})

test('a deleted boolean (null) is left empty, not the string "false"', async () => {
  const content = await writeAndRead({ read: null })
  assert.match(content, /^read: null$/m)
  assert.doesNotMatch(content, /read: (false|true)/)
})
