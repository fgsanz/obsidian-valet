import { When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { isKindleNote, buildSplitNotes } from '../../../src/server/services/kindle'
import { applyKindleSplit } from '../../../src/server/services/kindleSplit'
import type { KindleSplitOptions } from '@shared/types'
import type { ValetWorld } from '../../support/world'

function options(over: Partial<KindleSplitOptions>): KindleSplitOptions {
  return {
    prefix: 'Split',
    startNumber: 1,
    targetDir: '',
    properties: [],
    deleteOriginal: false,
    ...over,
  }
}

async function exists(p: string): Promise<boolean> {
  return stat(p).then(() => true).catch(() => false)
}

function requireKindleNote(world: ValetWorld) {
  if (!world.kindleNote) throw new Error('No Kindle note chosen — use "I choose the Kindle note" first.')
  return world.kindleNote
}

When('I choose the Kindle note {string}', function (this: ValetWorld, title: string) {
  this.kindleNote = this.noteByTitle(title)
})

Then('the note is recognised as a Kindle highlights note', function (this: ValetWorld) {
  assert.equal(isKindleNote(requireKindleNote(this).frontmatter), true)
})

Then('the note is not recognised as a Kindle highlights note', function (this: ValetWorld) {
  assert.equal(isKindleNote(requireKindleNote(this).frontmatter), false)
})

When('I preview the Kindle split with prefix {string}', function (this: ValetWorld, prefix: string) {
  this.splitPreview = buildSplitNotes(requireKindleNote(this), options({ prefix }), this.properties)
})

Then('{int} split notes are produced', function (this: ValetWorld, count: number) {
  assert.equal(this.splitPreview.length, count)
})

When(
  'I apply the Kindle split with prefix {string} into {string}',
  async function (this: ValetWorld, prefix: string, dir: string) {
    this.splitResult = await applyKindleSplit(
      this.vault.path,
      requireKindleNote(this),
      options({ prefix, targetDir: dir }),
      this.properties,
    )
  },
)

When(
  'I apply the Kindle split with prefix {string} into {string} deleting the original',
  async function (this: ValetWorld, prefix: string, dir: string) {
    this.splitResult = await applyKindleSplit(
      this.vault.path,
      requireKindleNote(this),
      options({ prefix, targetDir: dir, deleteOriginal: true }),
      this.properties,
    )
  },
)

Then('{int} split notes were created', function (this: ValetWorld, count: number) {
  if (!this.splitResult) throw new Error('No split has been applied yet.')
  assert.equal(this.splitResult.created, count)
})

Then('the first split note contains {string}', async function (this: ValetWorld, needle: string) {
  if (!this.splitResult) throw new Error('No split has been applied yet.')
  const content = await readFile(join(this.vault.path, this.splitResult.createdPaths[0]), 'utf-8')
  assert.ok(content.includes(needle), `Expected first split note to contain "${needle}"`)
})

Then('the original note still exists', async function (this: ValetWorld) {
  assert.equal(await exists(requireKindleNote(this).filePath), true)
})

Then('the original note no longer exists', async function (this: ValetWorld) {
  assert.equal(await exists(requireKindleNote(this).filePath), false)
})
