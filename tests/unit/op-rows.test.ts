import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRow, updateOpRow, removeOpRow } from '../../src/client/lib/opRows'

test('makeRow: gives each row a distinct id', () => {
  const a = makeRow()
  const b = makeRow()
  assert.notEqual(a.id, b.id)
})

test('makeRow: seeds property (and fromProperty) but leaves values empty', () => {
  const r = makeRow('parent')
  assert.equal(r.property, 'parent')
  assert.equal(r.fromProperty, 'parent')
  assert.equal(r.value, '')
  assert.equal(r.newValue, '')
  assert.equal(r.toProperty, '')
})

// Regression: editing one row must never change another (two rows sharing an id used to edit
// together). With distinct ids, updateOpRow only touches the targeted row.
test('updateOpRow: edits only the targeted row, leaving siblings untouched', () => {
  const rows = [makeRow('parent'), makeRow('parent')]
  const updated = updateOpRow(rows, rows[1].id, { property: 'related', value: 'X' })
  assert.equal(updated[0].property, 'parent')
  assert.equal(updated[0].value, '')
  assert.equal(updated[1].property, 'related')
  assert.equal(updated[1].value, 'X')
})

test('updateOpRow: returns a new array and does not mutate the input', () => {
  const rows = [makeRow('a')]
  const updated = updateOpRow(rows, rows[0].id, { value: 'v' })
  assert.notEqual(updated, rows)
  assert.equal(rows[0].value, '')
})

test('updateOpRow: a non-matching id changes nothing', () => {
  const rows = [makeRow('a'), makeRow('b')]
  const updated = updateOpRow(rows, 'no-such-id', { value: 'v' })
  assert.deepEqual(updated, rows)
})

test('removeOpRow: removes the matching row', () => {
  const rows = [makeRow('a'), makeRow('b')]
  const after = removeOpRow(rows, rows[0].id)
  assert.deepEqual(after.map((r) => r.property), ['b'])
})

test('removeOpRow: never removes the last remaining row', () => {
  const rows = [makeRow('only')]
  assert.deepEqual(removeOpRow(rows, rows[0].id), rows)
})
