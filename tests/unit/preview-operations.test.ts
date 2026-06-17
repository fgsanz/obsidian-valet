import { test } from 'node:test'
import assert from 'node:assert/strict'
import { previewOperations } from '../../src/server/services/operations'
import type { ParsedNote, Operation, PropertyDef } from '../../src/shared/types'

const defs: PropertyDef[] = [
  { name: 'parent', type: 'link-array' },
  { name: 'related', type: 'link-array' },
  { name: 'status', type: 'text' },
]

function note(filePath: string, frontmatter: Record<string, unknown>): ParsedNote {
  return { filePath, relativePath: filePath, title: filePath, frontmatter, rawFrontmatter: '', body: '' }
}

test('previewOperations: one operation per property changes both properties of a note', () => {
  const notes = [note('a', { parent: ['[[X]]', '[[Y]]'], related: ['[[T1]]', '[[T2]]'] })]
  const ops: Operation[] = [
    { type: 'delete-value', property: 'parent', value: '[[X]]' },
    { type: 'delete-value', property: 'related', value: '[[T1]]' },
  ]
  const [changed] = previewOperations(notes, ops, defs)
  assert.deepEqual(changed.frontmatter.parent, ['[[Y]]'])
  assert.deepEqual(changed.frontmatter.related, ['[[T2]]'])
})

test('previewOperations: a note changed by only one of the operations is still returned once', () => {
  const notes = [note('a', { parent: ['[[X]]'], related: ['[[T2]]'] })] // related has no [[T1]]
  const ops: Operation[] = [
    { type: 'delete-value', property: 'parent', value: '[[X]]' },
    { type: 'delete-value', property: 'related', value: '[[T1]]' },
  ]
  const changed = previewOperations(notes, ops, defs)
  assert.equal(changed.length, 1)
  assert.deepEqual(changed[0].frontmatter.parent, [])
  assert.deepEqual(changed[0].frontmatter.related, ['[[T2]]'])
})

test('previewOperations: a note matched by none of the operations is omitted', () => {
  const notes = [note('a', { parent: ['[[Z]]'], related: ['[[T9]]'] })]
  const ops: Operation[] = [
    { type: 'delete-value', property: 'parent', value: '[[X]]' },
    { type: 'delete-value', property: 'related', value: '[[T1]]' },
  ]
  assert.deepEqual(previewOperations(notes, ops, defs), [])
})

test('previewOperations: later operations see the result of earlier ones (chained)', () => {
  const notes = [note('a', { parent: ['[[X]]'] })]
  // Add [[X]] to related, then move [[X]] from related to parent — net effect chains through.
  const ops: Operation[] = [
    { type: 'add-value', property: 'related', value: '[[X]]' },
    { type: 'move-value', fromProperty: 'related', toProperty: 'parent', value: '[[X]]' },
  ]
  const [changed] = previewOperations(notes, ops, defs)
  assert.deepEqual(changed.frontmatter.related, [])
  // parent already had [[X]]; move into a multi-value prop doesn't duplicate it.
  assert.deepEqual(changed.frontmatter.parent, ['[[X]]'])
})

test('previewOperations: a single operation behaves like the singular preview', () => {
  const notes = [note('a', { parent: ['[[X]]', '[[Y]]'] })]
  const [changed] = previewOperations(notes, [{ type: 'delete-value', property: 'parent', value: '[[X]]' }], defs)
  assert.deepEqual(changed.frontmatter.parent, ['[[Y]]'])
})
