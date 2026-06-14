import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isNewer } from '../../src/client/lib/version'

test('isNewer: detects a higher version', () => {
  assert.equal(isNewer('0.2.0', '0.1.0'), true)
  assert.equal(isNewer('1.0.0', '0.9.9'), true)
  assert.equal(isNewer('0.1.1', '0.1.0'), true)
  assert.equal(isNewer('0.1.10', '0.1.9'), true)
})

test('isNewer: same or older versions are not newer', () => {
  assert.equal(isNewer('0.1.0', '0.1.0'), false)
  assert.equal(isNewer('0.1.0', '0.2.0'), false)
  assert.equal(isNewer('0.9.9', '1.0.0'), false)
})

test('isNewer: tolerates a leading "v"', () => {
  assert.equal(isNewer('v0.2.0', '0.1.0'), true)
  assert.equal(isNewer('v0.1.0', 'v0.1.0'), false)
})
