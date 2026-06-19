import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addValueStatus, canAddValue } from '../../src/client/lib/addValue'

// Mirror the real note shape passed by the UI — frontmatter is nested under `.frontmatter`, which
// is exactly what regressed (passing the value directly made every note look "empty").
const note = (value: unknown) => ({ frontmatter: { status: value } as Record<string, unknown> })
const noteWithout = () => ({ frontmatter: {} as Record<string, unknown> })

test('addValueStatus: multi-value property always ok (no caveat)', () => {
  assert.equal(addValueStatus([note('done'), note('done')], 'status', true), 'ok')
})

test('addValueStatus: single-value, every note empty → ok', () => {
  assert.equal(addValueStatus([note(null), note(''), noteWithout()], 'status', false), 'ok')
})

// The reported bug: some notes have a value, some are empty → still applicable (some skipped).
test('addValueStatus: single-value, some have a value and some empty → some-skipped', () => {
  assert.equal(addValueStatus([note('done'), note(null), noteWithout()], 'status', false), 'some-skipped')
})

// Regression: every matched note already has a value → must block (no point applying).
test('addValueStatus: single-value, all notes have a value → all-skipped', () => {
  assert.equal(addValueStatus([note('done'), note('todo')], 'status', false), 'all-skipped')
})

test('addValueStatus: reads the nested frontmatter, not the note object itself', () => {
  // If the value were read off the note object directly, this would wrongly be "ok".
  assert.equal(addValueStatus([note('a'), note('b')], 'status', false), 'all-skipped')
})

test('addValueStatus: no matched notes → ok (not a caveat; gated elsewhere)', () => {
  assert.equal(addValueStatus([], 'status', false), 'ok')
})

test('addValueStatus: empty string and empty array count as empty', () => {
  assert.equal(addValueStatus([note('   '), note([])], 'status', false), 'ok')
})

test('canAddValue: only all-skipped blocks the operation', () => {
  assert.equal(canAddValue('ok'), true)
  assert.equal(canAddValue('some-skipped'), true)
  assert.equal(canAddValue('all-skipped'), false)
})
