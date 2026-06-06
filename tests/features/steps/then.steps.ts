import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { Then } from '@cucumber/cucumber'
import { extractFrontmatter } from '../../../src/server/services/frontmatter'
import type { ValetWorld } from '../../support/world'

/** Loose normaliser: strips [[ ]] link brackets and leading #, lowercases and trims. */
function loose(value: unknown): string {
  return String(value ?? '')
    .replace(/^\[\[/, '')
    .replace(/\]\]$/, '')
    .replace(/^#/, '')
    .trim()
    .toLowerCase()
}

/** Whether a frontmatter property (scalar or array) contains the expected value. */
function propertyContains(propValue: unknown, expected: string): boolean {
  const target = loose(expected)
  if (Array.isArray(propValue)) {
    return propValue.some((v) => loose(v) === target)
  }
  return loose(propValue) === target
}

function requireResult(world: ValetWorld) {
  if (!world.result) {
    throw new Error('No operation has been applied yet — apply one before asserting on results.')
  }
  return world.result
}

// ── Count assertions ──────────────────────────────────────────────────────────

Then('{int} notes match', function (this: ValetWorld, count: number) {
  this.log(`→ matched: ${this.matched.map((n) => n.title).join(', ') || '(none)'}`)
  assert.equal(
    this.matched.length,
    count,
    `Expected ${count} matching notes but got ${this.matched.length}: ${this.matched
      .map((n) => n.title)
      .join(', ')}`,
  )
})

Then('{int} notes are changed', function (this: ValetWorld, count: number) {
  const result = requireResult(this)
  this.log(`→ ${result.succeeded} changed, ${result.failed} skipped`)
  assert.equal(result.succeeded, count, `Expected ${count} changed notes but got ${result.succeeded}`)
})

Then('{int} notes fail', function (this: ValetWorld, count: number) {
  const result = requireResult(this)
  this.log(`→ ${result.failed} failed`)
  assert.equal(result.failed, count, `Expected ${count} failed notes but got ${result.failed}`)
})

// ── Per-note property assertions (read fresh from disk) ─────────────────────────

Then(
  'note {string} has {string} in {string}',
  async function (this: ValetWorld, title: string, value: string, property: string) {
    const note = await this.reread(title)
    this.log(`→ ${title}.${property} = ${JSON.stringify(note.frontmatter[property])}`)
    assert.ok(
      propertyContains(note.frontmatter[property], value),
      `Expected note "${title}" to have "${value}" in "${property}", but value was: ${JSON.stringify(
        note.frontmatter[property],
      )}`,
    )
  },
)

Then(
  'note {string} no longer has {string} in {string}',
  async function (this: ValetWorld, title: string, value: string, property: string) {
    const note = await this.reread(title)
    this.log(`→ ${title}.${property} = ${JSON.stringify(note.frontmatter[property])}`)
    assert.ok(
      !propertyContains(note.frontmatter[property], value),
      `Expected note "${title}" to NOT have "${value}" in "${property}", but value was: ${JSON.stringify(
        note.frontmatter[property],
      )}`,
    )
  },
)

Then(
  'note {string} has property {string} equal to {string}',
  async function (this: ValetWorld, title: string, property: string, expected: string) {
    const note = await this.reread(title)
    this.log(`→ ${title}.${property} = ${JSON.stringify(note.frontmatter[property])}`)
    assert.equal(
      String(note.frontmatter[property] ?? ''),
      expected,
      `Expected note "${title}" property "${property}" to equal "${expected}"`,
    )
  },
)

Then('the YAML of {string} is still valid', async function (this: ValetWorld, title: string) {
  const note = this.noteByTitle(title)
  const content = await readFile(note.filePath, 'utf-8')
  const fm = extractFrontmatter(content)
  this.log(`→ ${title} frontmatter keys: ${fm ? Object.keys(fm).join(', ') : '(invalid)'}`)
  assert.notEqual(fm, null, `Frontmatter of note "${title}" no longer parses as valid YAML`)
})
