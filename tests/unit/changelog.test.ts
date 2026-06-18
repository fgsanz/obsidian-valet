import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseChangelog } from '../../src/client/lib/changelog'

const SAMPLE = `# Changelog

All notable changes are documented in this file.

## [0.2.0] - 2026-06-18

A small follow-up.

### Added

- A **shiny** new thing with \`code\`

### Fixed

- A bug that spanned
  two wrapped lines

## [0.1.0] - 2026-06-13

First public release.

### Added

- Filtering
- Bulk operations

[0.2.0]: https://example.com/v0.2.0
[0.1.0]: https://example.com/v0.1.0

---

The format is based on Keep a Changelog.
`

test('parseChangelog: returns one entry per version, newest first', () => {
  const releases = parseChangelog(SAMPLE)
  assert.deepEqual(releases.map((r) => r.version), ['0.2.0', '0.1.0'])
})

test('parseChangelog: extracts the date', () => {
  const [latest] = parseChangelog(SAMPLE)
  assert.equal(latest.date, '2026-06-18')
})

test('parseChangelog: captures the summary line before the first category', () => {
  const releases = parseChangelog(SAMPLE)
  assert.equal(releases[0].summary, 'A small follow-up.')
  assert.equal(releases[1].summary, 'First public release.')
})

test('parseChangelog: groups items under their category', () => {
  const [latest] = parseChangelog(SAMPLE)
  assert.deepEqual(latest.groups.map((g) => g.category), ['Added', 'Fixed'])
  assert.deepEqual(latest.groups[0].items, ['A **shiny** new thing with `code`'])
})

test('parseChangelog: joins wrapped bullet lines into one item', () => {
  const [latest] = parseChangelog(SAMPLE)
  assert.deepEqual(latest.groups[1].items, ['A bug that spanned two wrapped lines'])
})

test('parseChangelog: ignores preamble, link references and the trailing footer', () => {
  const releases = parseChangelog(SAMPLE)
  const allItems = releases.flatMap((r) => r.groups.flatMap((g) => g.items))
  assert.ok(!allItems.some((i) => i.includes('Keep a Changelog')))
  assert.ok(!allItems.some((i) => i.includes('http')))
  assert.ok(!releases.some((r) => r.summary.includes('All notable changes')))
})

test('parseChangelog: a version without a date yields null', () => {
  const [r] = parseChangelog('## [1.0.0]\n\n### Added\n- thing\n')
  assert.equal(r.date, null)
})

test('parseChangelog: tolerates an em-dash between version and date', () => {
  const [r] = parseChangelog('## 1.2.0 — 2026-07-01\n\n### Added\n- thing\n')
  assert.equal(r.version, '1.2.0')
  assert.equal(r.date, '2026-07-01')
})

test('parseChangelog: empty input yields no releases', () => {
  assert.deepEqual(parseChangelog(''), [])
})
