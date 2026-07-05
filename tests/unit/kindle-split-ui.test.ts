import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  splitPaddingWidth,
  splitName,
  splitExampleNames,
  canRunSplit,
} from '../../src/client/lib/kindleSplit'

test('splitPaddingWidth: uses the declared count width, at least the last number width', () => {
  assert.equal(splitPaddingWidth(187, 187), 3)
  assert.equal(splitPaddingWidth(187, 191), 3) // start offset pushes last past the declared count
  assert.equal(splitPaddingWidth(9, 9), 1)
  assert.equal(splitPaddingWidth(null, 12), 2)
  assert.equal(splitPaddingWidth(1000, 5), 4)
})

test('splitName: zero-pads the counter to the width', () => {
  assert.equal(splitName('Book', 1, 3), 'Book — 001')
  assert.equal(splitName('Book', 187, 3), 'Book — 187')
})

test('splitExampleNames: first and last for 187 highlights', () => {
  const { first, last } = splitExampleNames('Book', 1, 187, 187)
  assert.equal(first, 'Book — 001')
  assert.equal(last, 'Book — 187')
})

test('splitExampleNames: honours the start number', () => {
  const { first, last } = splitExampleNames('Book', 5, 187, 187)
  assert.equal(first, 'Book — 005')
  assert.equal(last, 'Book — 191')
})

test('canRunSplit: needs a Kindle note, a prefix and a folder', () => {
  assert.equal(canRunSplit({ isKindle: true, prefix: 'P', targetDir: 'Books' }), true)
  assert.equal(canRunSplit({ isKindle: false, prefix: 'P', targetDir: 'Books' }), false)
  assert.equal(canRunSplit({ isKindle: true, prefix: '   ', targetDir: 'Books' }), false)
  assert.equal(canRunSplit({ isKindle: true, prefix: 'P', targetDir: '' }), false)
})
