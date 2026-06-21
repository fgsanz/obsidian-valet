import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesRequiredText } from '../../src/client/lib/confirmText'

test('matchesRequiredText: exact match enables confirmation', () => {
  assert.equal(matchesRequiredText('revert', 'revert'), true)
})

test('matchesRequiredText: surrounding whitespace is tolerated', () => {
  assert.equal(matchesRequiredText('  revert  ', 'revert'), true)
})

test('matchesRequiredText: empty / partial input does not match', () => {
  assert.equal(matchesRequiredText('', 'revert'), false)
  assert.equal(matchesRequiredText('rev', 'revert'), false)
  assert.equal(matchesRequiredText('revert now', 'revert'), false)
})

test('matchesRequiredText: match is case-sensitive', () => {
  assert.equal(matchesRequiredText('Revert', 'revert'), false)
  assert.equal(matchesRequiredText('REVERT', 'revert'), false)
})
