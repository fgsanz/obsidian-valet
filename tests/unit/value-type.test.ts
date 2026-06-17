import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidValueForType, expectedFormatHint } from '../../src/shared/properties'

test('isValidValueForType: text and text-array accept any non-empty value', () => {
  assert.equal(isValidValueForType('anything', 'text'), true)
  assert.equal(isValidValueForType('anything', 'text-array'), true)
})

test('isValidValueForType: empty / whitespace is never valid', () => {
  assert.equal(isValidValueForType('', 'text'), false)
  assert.equal(isValidValueForType('   ', 'link-array'), false)
})

test('isValidValueForType: link and link-array require [[...]]', () => {
  assert.equal(isValidValueForType('[[Note]]', 'link'), true)
  assert.equal(isValidValueForType('[[Note]]', 'link-array'), true)
  // The reported bug: a plain word is not a valid link.
  assert.equal(isValidValueForType('eee', 'link-array'), false)
  assert.equal(isValidValueForType('eee', 'link'), false)
})

test('isValidValueForType: tag-array accepts tag or tag/subtag, rejects spaces/brackets', () => {
  assert.equal(isValidValueForType('tag', 'tag-array'), true)
  assert.equal(isValidValueForType('tag/subtag', 'tag-array'), true)
  assert.equal(isValidValueForType('two words', 'tag-array'), false)
  assert.equal(isValidValueForType('[[Note]]', 'tag-array'), false)
})

test('isValidValueForType: number, boolean, date, week-link', () => {
  assert.equal(isValidValueForType('42', 'number'), true)
  assert.equal(isValidValueForType('4x', 'number'), false)
  assert.equal(isValidValueForType('true', 'boolean'), true)
  assert.equal(isValidValueForType('yes', 'boolean'), false)
  assert.equal(isValidValueForType('2026-01-01', 'date'), true)
  assert.equal(isValidValueForType('01-01-2026', 'date'), false)
  assert.equal(isValidValueForType('[[2026-W08]]', 'week-link'), true)
  assert.equal(isValidValueForType('2026-W08', 'week-link'), false)
})

test('expectedFormatHint: gives a link hint for link types', () => {
  assert.match(expectedFormatHint('link-array'), /\[\[Note name\]\]/)
  assert.match(expectedFormatHint('date'), /2026-01-01/)
})
