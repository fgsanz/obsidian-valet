import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  saveOperationsSnapshot,
  loadOperationsSnapshot,
  type OperationsSnapshot,
} from '../../src/client/lib/operationsSnapshot'
import { makeRow } from '../../src/client/lib/opRows'

// Build a snapshot carrying an in-progress operation draft (type + a row with an entered value).
function snapshot(vaultId: string, value: string): OperationsSnapshot {
  return {
    vaultId,
    activeTab: 'ops',
    criteria: {
      location: [{ operator: 'all-directories', combinator: 'and' }],
      properties: [{ property: '', operator: 'contains', combinator: 'and' }],
    },
    matchedNotes: null,
    previewNotes: null,
    result: null,
    pendingOperations: null,
    gitCommitted: false,
    filterError: null,
    opType: 'add-value',
    opRows: [{ ...makeRow('parent'), value }],
    snapshotTaken: true,
  }
}

test('snapshot: round-trips the in-progress operation draft for the same vault', () => {
  saveOperationsSnapshot(snapshot('vault-a', '[[Note Z]]'))
  const loaded = loadOperationsSnapshot('vault-a')
  assert.ok(loaded)
  assert.equal(loaded?.opType, 'add-value')
  // The entered value (which used to be lost on navigation) survives the save/load.
  assert.equal(loaded?.opRows[0].value, '[[Note Z]]')
  assert.equal(loaded?.opRows[0].property, 'parent')
  // The snapshot-taken flag survives too, so the right revert flow is chosen after returning.
  assert.equal(loaded?.snapshotTaken, true)
})

test('snapshot: round-trips the applied results table (matched notes + result counts)', () => {
  const withResult: OperationsSnapshot = {
    ...snapshot('vault-r', 'x'),
    matchedNotes: [
      { filePath: 'a.md', relativePath: 'a.md', title: 'a', frontmatter: {}, rawFrontmatter: '', body: '' },
    ],
    result: { matched: 1, succeeded: 1, failed: 0, errors: [], changedPaths: ['a.md'] },
  }
  saveOperationsSnapshot(withResult)
  const loaded = loadOperationsSnapshot('vault-r')
  assert.equal(loaded?.matchedNotes?.length, 1)
  assert.equal(loaded?.result?.succeeded, 1)
  assert.equal(loaded?.result?.matched, 1)
})

test('snapshot: a different active vault gets no restore (state resets)', () => {
  saveOperationsSnapshot(snapshot('vault-a', 'x'))
  assert.equal(loadOperationsSnapshot('vault-b'), null)
})

test('snapshot: null vault id returns nothing', () => {
  saveOperationsSnapshot(snapshot('vault-a', 'x'))
  assert.equal(loadOperationsSnapshot(null), null)
})

test('snapshot: switching the saved vault drops the previous one (single slot)', () => {
  saveOperationsSnapshot(snapshot('vault-a', 'x'))
  saveOperationsSnapshot(snapshot('vault-b', 'y'))
  assert.equal(loadOperationsSnapshot('vault-a'), null)
  assert.equal(loadOperationsSnapshot('vault-b')?.opRows[0].value, 'y')
})
