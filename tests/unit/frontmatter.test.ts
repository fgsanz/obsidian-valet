import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  inferType,
  isEmptyPropertyValue,
  normalizeLinkTarget,
  parseNote,
} from '../../src/server/services/frontmatter'
import { TEST_VAULT_PROPERTIES } from '../support/vault-schema'

test('inferType: "tags" is always a tag-array', () => {
  assert.equal(inferType('tags', ['foo']), 'tag-array')
  assert.equal(inferType('tags', null), 'tag-array')
  assert.equal(inferType('tags', 'foo'), 'tag-array')
})

test('inferType: detects types by value shape', () => {
  assert.equal(inferType('parent', ['[[A]]']), 'link-array')
  assert.equal(inferType('x', ['#a']), 'tag-array')
  assert.equal(inferType('x', ['a', 'b']), 'text-array')
  assert.equal(inferType('x', '[[A]]'), 'link')
  assert.equal(inferType('x', '[[2025-W52]]'), 'week-link')
  assert.equal(inferType('x', '2025-12-31'), 'date')
  assert.equal(inferType('x', 42), 'number')
  assert.equal(inferType('x', true), 'boolean')
  assert.equal(inferType('x', 'hello'), 'text')
})

test('isEmptyPropertyValue: null / blank / empty array are empty', () => {
  for (const v of [null, undefined, '', '   ', []]) {
    assert.equal(isEmptyPropertyValue(v), true, `${JSON.stringify(v)} should be empty`)
  }
  for (const v of ['x', ['x'], false, 0]) {
    assert.equal(isEmptyPropertyValue(v), false, `${JSON.stringify(v)} should not be empty`)
  }
})

test('normalizeLinkTarget: strips brackets and alias, lowercases', () => {
  assert.equal(normalizeLinkTarget('[[Note A]]'), 'note a')
  assert.equal(normalizeLinkTarget('[[Note A|Alias]]'), 'note a')
  assert.equal(normalizeLinkTarget('Note A'), 'note a')
})

test('parseNote: collapsed and expanded YAML parse identically', () => {
  const collapsed = [
    '---',
    'tags: [tag1, tag2]',
    'aliases: [alias 1, alias 2]',
    'date: 2025-12-31',
    'parent: ["[[Note X]]", "[[Note Y|Y notes]]"]',
    '---',
    'body',
  ].join('\n')
  const expanded = [
    '---',
    'tags:',
    '  - tag1',
    '  - tag2',
    'aliases:',
    '  - alias 1',
    '  - alias 2',
    'date: 2025-12-31',
    'parent:',
    '  - "[[Note X]]"',
    '  - "[[Note Y|Y notes]]"',
    '---',
    'body',
  ].join('\n')
  const a = parseNote('/v/A.md', 'A.md', collapsed, TEST_VAULT_PROPERTIES)
  const b = parseNote('/v/A.md', 'A.md', expanded, TEST_VAULT_PROPERTIES)
  assert.deepEqual(a.frontmatter, b.frontmatter)
})

test('parseNote: the note name is the filename, not the title frontmatter', () => {
  const content = '---\ntitle: A Different Title\n---\nbody'
  const note = parseNote('/v/Real Filename.md', 'Real Filename.md', content, [])
  assert.equal(note.title, 'Real Filename')
})

test('parseNote: a note without frontmatter yields empty frontmatter', () => {
  const note = parseNote('/v/Plain.md', 'Plain.md', 'just text', [])
  assert.deepEqual(note.frontmatter, {})
})
