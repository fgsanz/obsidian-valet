import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deleteValueStatus, canDeleteValue } from '../../src/client/lib/deleteValue'

// Mirror the real note shape passed by the UI: the value lives under `.frontmatter`.
const note = (value: unknown) => ({ frontmatter: { 'number headings': value } as Record<string, unknown> })
const noteWithout = () => ({ frontmatter: {} as Record<string, unknown> })

test('deleteValueStatus: every note has content → ok', () => {
  assert.equal(deleteValueStatus([note('a'), note('b')], 'number headings'), 'ok')
})

// The reported case: some notes have content, some are empty/absent → warn but allow.
test('deleteValueStatus: some notes empty/absent, at least one with content → some-skipped', () => {
  const notes = [note('auto, max 3'), note(null), note(''), noteWithout()]
  assert.equal(deleteValueStatus(notes, 'number headings'), 'some-skipped')
})

test('deleteValueStatus: all notes empty or missing the property → all-skipped', () => {
  assert.equal(deleteValueStatus([note(null), note(''), noteWithout()], 'number headings'), 'all-skipped')
})

test('deleteValueStatus: reads nested frontmatter, not the note object', () => {
  // If read off the note object directly, every value would look empty → wrongly all-skipped.
  assert.equal(deleteValueStatus([note('x'), note('y')], 'number headings'), 'ok')
})

test('deleteValueStatus: empty string and empty array count as empty', () => {
  assert.equal(deleteValueStatus([note('   '), note([])], 'number headings'), 'all-skipped')
})

test('deleteValueStatus: no matched notes / no property → ok (gated elsewhere)', () => {
  assert.equal(deleteValueStatus([], 'number headings'), 'ok')
  assert.equal(deleteValueStatus([note('a')], ''), 'ok')
})

test('canDeleteValue: only all-skipped blocks the operation', () => {
  assert.equal(canDeleteValue('ok'), true)
  assert.equal(canDeleteValue('some-skipped'), true)
  assert.equal(canDeleteValue('all-skipped'), false)
})
