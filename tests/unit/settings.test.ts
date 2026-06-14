import { test } from 'node:test'
import assert from 'node:assert/strict'
import { userSettingsSchema } from '../../src/shared/schemas'

test('settings schema: empty input yields all defaults', () => {
  assert.deepEqual(userSettingsSchema.parse({}), {
    schemaVersion: 1,
    colorScheme: 'system',
    checkForUpdates: true,
    dismissedVersion: null,
  })
})

test('settings schema: a missing field (newer-version case) falls back to its default', () => {
  const r = userSettingsSchema.parse({ colorScheme: 'light' })
  assert.equal(r.colorScheme, 'light')
  assert.equal(r.checkForUpdates, true)
  assert.equal(r.dismissedVersion, null)
})

test('settings schema: unknown keys are stripped', () => {
  const r = userSettingsSchema.parse({ colorScheme: 'dark', bogus: 123 }) as Record<string, unknown>
  assert.ok(!('bogus' in r))
  assert.equal(r.colorScheme, 'dark')
})

test('settings schema: invalid values fall back to defaults', () => {
  const r = userSettingsSchema.parse({
    colorScheme: 'purple',
    checkForUpdates: 'yes',
    dismissedVersion: 5,
  })
  assert.equal(r.colorScheme, 'system')
  assert.equal(r.checkForUpdates, true)
  assert.equal(r.dismissedVersion, null)
})

test('settings schema: valid values are preserved', () => {
  const input = {
    schemaVersion: 1,
    colorScheme: 'dark' as const,
    checkForUpdates: false,
    dismissedVersion: '0.2.0',
  }
  assert.deepEqual(userSettingsSchema.parse(input), input)
})
