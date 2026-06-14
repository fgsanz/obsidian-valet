import { test } from 'node:test'
import assert from 'node:assert/strict'
import { movableFromOptions, isMoveValid } from '../../src/client/lib/operators'

test('movableFromOptions: excludes the property chosen as the move target', () => {
  assert.deepEqual(movableFromOptions(['parent', 'related', 'tags'], 'related'), ['parent', 'tags'])
})

test('movableFromOptions: returns all properties when no target is selected', () => {
  assert.deepEqual(movableFromOptions(['parent', 'related'], ''), ['parent', 'related'])
})

test('movableFromOptions: a target not in the list leaves the options unchanged', () => {
  assert.deepEqual(movableFromOptions(['parent', 'related'], 'unknown'), ['parent', 'related'])
})

test('movableFromOptions: preserves the original order of the remaining options', () => {
  assert.deepEqual(movableFromOptions(['a', 'b', 'c', 'd'], 'c'), ['a', 'b', 'd'])
})

test('movableFromOptions: an empty property list yields an empty result', () => {
  assert.deepEqual(movableFromOptions([], 'anything'), [])
})

test('isMoveValid: valid when from, to, and value are set and differ', () => {
  assert.equal(isMoveValid('parent', 'related', '[[Note]]'), true)
})

test('isMoveValid: invalid when from and to are the same property', () => {
  assert.equal(isMoveValid('parent', 'parent', '[[Note]]'), false)
})

test('isMoveValid: invalid when the from property is missing', () => {
  assert.equal(isMoveValid('', 'related', '[[Note]]'), false)
})

test('isMoveValid: invalid when the to property is missing', () => {
  assert.equal(isMoveValid('parent', '', '[[Note]]'), false)
})

test('isMoveValid: invalid when the value is empty', () => {
  assert.equal(isMoveValid('parent', 'related', ''), false)
})
