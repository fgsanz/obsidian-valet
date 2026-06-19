import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addValueStatus, canAddValue } from '../../src/client/lib/addValue'

const fm = (value: unknown) => ({ status: value } as Record<string, unknown>)

test('addValueStatus: multi-value property always ok (no caveat)', () => {
  assert.equal(addValueStatus([fm('done'), fm('done')], 'status', true), 'ok')
})

test('addValueStatus: single-value, every note empty → ok', () => {
  assert.equal(addValueStatus([fm(null), fm(''), {}], 'status', false), 'ok')
})

// The reported bug: some notes have a value, some are empty → still applicable (some skipped).
test('addValueStatus: single-value, some have a value and some empty → some-skipped', () => {
  assert.equal(addValueStatus([fm('done'), fm(null), {}], 'status', false), 'some-skipped')
})

test('addValueStatus: single-value, all notes have a value → all-skipped', () => {
  assert.equal(addValueStatus([fm('done'), fm('todo')], 'status', false), 'all-skipped')
})

test('addValueStatus: no matched notes → ok (not a caveat; gated elsewhere)', () => {
  assert.equal(addValueStatus([], 'status', false), 'ok')
})

test('addValueStatus: empty string and empty array count as empty', () => {
  assert.equal(addValueStatus([{ status: '   ' }, { status: [] }], 'status', false), 'ok')
})

test('canAddValue: only all-skipped blocks the operation', () => {
  assert.equal(canAddValue('ok'), true)
  assert.equal(canAddValue('some-skipped'), true)
  assert.equal(canAddValue('all-skipped'), false)
})
