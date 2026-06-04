import { cp, rm, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Before, After } from '@cucumber/cucumber'
import { invalidateCache } from '../../src/server/services/scanner'
import { TEST_VAULT_PROPERTIES } from './vault-schema'
import type { ValetWorld } from './world'

const FIXTURE_VAULT = fileURLToPath(new URL('../fixtures/test-vault', import.meta.url))

/**
 * Before each scenario: copy the committed test vault into a unique OS temp directory and
 * point the Vault object at the copy. Every write the valet performs lands in the copy, so
 * the committed fixture is never mutated.
 */
Before(async function (this: ValetWorld) {
  this.tmpVaultDir = await mkdtemp(join(tmpdir(), 'ov-test-'))
  await cp(FIXTURE_VAULT, this.tmpVaultDir, { recursive: true })

  this.vault = {
    id: `test-${randomUUID()}`,
    name: 'Test Vault',
    path: this.tmpVaultDir,
    forbiddenDirs: [],
    properties: TEST_VAULT_PROPERTIES,
  }

  await this.scan()
})

/**
 * After each scenario: drop the scan cache and delete the temp copy.
 */
After(async function (this: ValetWorld) {
  if (this.vault) invalidateCache(this.vault.id)
  if (this.tmpVaultDir) {
    await rm(this.tmpVaultDir, { recursive: true, force: true })
  }
})
