import { When } from '@cucumber/cucumber'
import type { PropertyOperator, LocationOperator, Operation } from '@shared/types'
import { filterByCriteria } from '../../../src/server/services/filter'
import { applyOperation } from '../../../src/server/services/operations'
import { invalidateCache } from '../../../src/server/services/scanner'
import type { ValetWorld } from '../../support/world'

/** Map the natural-language operator phrase used in features to a PropertyOperator. */
const PROPERTY_OPERATORS: Record<string, PropertyOperator> = {
  'exists and contains': 'contains',
  'exists and does not contain': 'not-contains',
  'exists and is empty': 'exists-and-empty',
  'exists and is not empty': 'exists-and-not-empty',
  exists: 'exists',
  'does not exist': 'does-not-exist',
}

function resolveOperator(phrase: string): PropertyOperator {
  const op = PROPERTY_OPERATORS[phrase]
  if (!op) {
    throw new Error(
      `Unknown operator phrase "${phrase}". Use one of: ${Object.keys(PROPERTY_OPERATORS).join(', ')}`,
    )
  }
  return op
}

function runFilter(world: ValetWorld) {
  world.matched = filterByCriteria(world.notes, world.criteria, world.properties)
  const titles = world.matched.map((n) => n.title).join(', ') || '(none)'
  world.log(`→ ${world.matched.length} matched: ${titles}`)
}

// ── Filter steps ──────────────────────────────────────────────────────────────

When(
  'I filter notes where {string} {string} {string}',
  function (this: ValetWorld, property: string, phrase: string, value: string) {
    this.criteria.properties.push({
      property,
      operator: resolveOperator(phrase),
      value,
      combinator: 'and',
    })
    runFilter(this)
  },
)

When(
  'I filter notes where {string} {string}',
  function (this: ValetWorld, property: string, phrase: string) {
    this.criteria.properties.push({
      property,
      operator: resolveOperator(phrase),
      combinator: 'and',
    })
    runFilter(this)
  },
)

When('I filter notes in directory {string}', function (this: ValetWorld, directory: string) {
  this.criteria.location.push({
    operator: 'directory-is',
    directory,
    combinator: 'and',
  })
  runFilter(this)
})

/** Map the GUI directory-operator labels ("is" / "is not") to LocationOperators. */
const DIRECTORY_OPERATORS: Record<string, LocationOperator> = {
  is: 'directory-is',
  'is not': 'directory-is-not',
}

function resolveDirectoryOperator(phrase: string): LocationOperator {
  const op = DIRECTORY_OPERATORS[phrase]
  if (!op) {
    throw new Error(
      `Unknown directory operator "${phrase}". Use one of: ${Object.keys(DIRECTORY_OPERATORS).join(', ')}`,
    )
  }
  return op
}

function assertCombinator(value: string): 'and' | 'or' {
  if (value !== 'and' && value !== 'or') {
    throw new Error(`Combinator must be "and" or "or", got "${value}".`)
  }
  return value
}

/** First directory rule — the "Where" row in the GUI, which has no combinator. */
When(
  'I filter notes where directory {string} {string}',
  function (this: ValetWorld, phrase: string, directory: string) {
    this.criteria.location.push({
      operator: resolveDirectoryOperator(phrase),
      directory,
      combinator: 'and',
    })
    runFilter(this)
  },
)

/**
 * A chained directory rule with an explicit combinator, mirroring the GUI's AND/OR dropdown.
 * Rules combine left-to-right, so the combinator stated here is how this rule joins the result
 * accumulated so far.
 */
When(
  'combining with {string} where directory {string} {string}',
  function (this: ValetWorld, combinator: string, phrase: string, directory: string) {
    this.criteria.location.push({
      operator: resolveDirectoryOperator(phrase),
      directory,
      combinator: assertCombinator(combinator),
    })
    runFilter(this)
  },
)

// ── Operation steps ─────────────────────────────────────────────────────────────

async function applyAndRescan(world: ValetWorld, operation: Operation) {
  world.result = await applyOperation(world.matched, operation, world.properties)
  invalidateCache(world.vault.id)
  await world.scan()
  const r = world.result
  world.log(`→ ${r.succeeded} changed, ${r.failed} skipped`)
  if (r.errors.length) {
    r.errors.forEach((e) => world.log(`  ✗ ${e.filePath}: ${e.error}`))
  }
}

When(
  'I apply delete value on property {string} with value to delete {string}',
  async function (this: ValetWorld, property: string, value: string) {
    await applyAndRescan(this, { type: 'delete-value', property, value })
  },
)

When(
  'I apply add value on property {string} with value to add {string}',
  async function (this: ValetWorld, property: string, value: string) {
    await applyAndRescan(this, { type: 'add-value', property, value })
  },
)

When(
  'I apply replace value on property {string} current value {string} new value {string}',
  async function (this: ValetWorld, property: string, oldValue: string, newValue: string) {
    await applyAndRescan(this, { type: 'replace', property, oldValue, newValue })
  },
)

When(
  'I apply move value from property {string} to property {string} value to move {string}',
  async function (this: ValetWorld, fromProperty: string, toProperty: string, value: string) {
    await applyAndRescan(this, { type: 'move-value', fromProperty, toProperty, value })
  },
)
