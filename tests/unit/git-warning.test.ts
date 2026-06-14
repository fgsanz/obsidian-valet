import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldWarnNoGit } from '../../src/client/lib/gitWarning'

test('git warning: warns when the vault has no Git and was not acknowledged', () => {
  assert.equal(shouldWarnNoGit(false, 'vault-a', []), true)
})

test('git warning: does not warn when the vault has Git', () => {
  assert.equal(shouldWarnNoGit(true, 'vault-a', []), false)
})

test('git warning: does not warn for an acknowledged vault', () => {
  assert.equal(shouldWarnNoGit(false, 'vault-a', ['vault-a']), false)
})

test('git warning: acknowledging one vault does not suppress the warning for another', () => {
  // vault-a is acknowledged, but vault-b (also without Git) should still warn.
  assert.equal(shouldWarnNoGit(false, 'vault-b', ['vault-a']), true)
})

test('git warning: a Git-enabled vault never warns even if somehow acknowledged', () => {
  assert.equal(shouldWarnNoGit(true, 'vault-a', ['vault-a']), false)
})
