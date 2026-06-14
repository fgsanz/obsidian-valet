import { test } from 'node:test'
import assert from 'node:assert/strict'
import { forgetVault } from '../../src/shared/settings'
import type { UserSettings } from '../../src/shared/schemas'

function makeSettings(gitAckVaultIds: string[]): UserSettings {
  return {
    schemaVersion: 1,
    colorScheme: 'system',
    checkForUpdates: true,
    dismissedVersion: null,
    gitAckVaultIds,
  }
}

test('forgetVault: removes the deleted vault id from gitAckVaultIds', () => {
  const result = forgetVault(makeSettings(['a', 'b', 'c']), 'b')
  assert.deepEqual(result.gitAckVaultIds, ['a', 'c'])
})

test('forgetVault: keeps other vaults acknowledged', () => {
  const result = forgetVault(makeSettings(['a', 'b']), 'a')
  assert.deepEqual(result.gitAckVaultIds, ['b'])
})

test('forgetVault: is a no-op when the vault was never acknowledged', () => {
  const result = forgetVault(makeSettings(['a', 'b']), 'z')
  assert.deepEqual(result.gitAckVaultIds, ['a', 'b'])
})

test('forgetVault: handles an empty ack list', () => {
  const result = forgetVault(makeSettings([]), 'a')
  assert.deepEqual(result.gitAckVaultIds, [])
})

test('forgetVault: leaves the other settings fields untouched', () => {
  const settings = makeSettings(['a'])
  const result = forgetVault(settings, 'a')
  assert.equal(result.schemaVersion, settings.schemaVersion)
  assert.equal(result.colorScheme, settings.colorScheme)
  assert.equal(result.checkForUpdates, settings.checkForUpdates)
  assert.equal(result.dismissedVersion, settings.dismissedVersion)
})

test('forgetVault: does not mutate the input settings', () => {
  const settings = makeSettings(['a', 'b'])
  forgetVault(settings, 'a')
  assert.deepEqual(settings.gitAckVaultIds, ['a', 'b'])
})
