---
title: Testing
slug: testing
description: Test suite — running tests, coverage, writing scenarios, step vocabulary
---

# Testing

Obsidian Valet's test suite has three layers:

- **BDD scenarios** driven by [Cucumber.js](https://cucumber.io/docs/cucumber/) and written in Gherkin, run in-process against the real filter/operation services (no HTTP server needed). See the generated [Test cases](test-cases) list.
- **Unit tests** (Node's built-in `node:test`) for pure logic that's awkward to reach through scenarios — type inference, emptiness checks, wiki-link parsing, the settings schema, version comparison, the operation-applicability rules, and the page-state snapshot.
- **Interaction (component) tests** that render React components with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) in a jsdom DOM, to verify UI behaviour — e.g. the clear-value buttons, the property selector's dropdown/filtering, and the type-to-confirm dialog. These live alongside the unit tests and run as part of `npm run test:unit`.

# Running the suite

## `npm test` — everything

The default. Runs the **unit tests first, then the BDD scenarios**, giving a single pass/fail signal for the whole suite.

```bash
npm test
```

The BDD part prints a compact progress bar (`.` per passing step, `F` per failure) and a summary. On failure the full assertion diff is shown:

```
AssertionError: Expected 2 matching notes but got 3: Note A, Note B, Note D
  at Then(2 notes match) in then.steps.ts:36
  in Scenario: Filter by a tag value  (filter.feature:5)
```

## `npm run test:unit` / `npm run test:bdd` — one layer

Run just one layer when iterating:

```bash
npm run test:unit   # node:test unit tests AND interaction (component) tests
npm run test:bdd    # only the Cucumber BDD scenarios
```

`test:unit` runs both the pure unit tests (`*.test.ts`) and the interaction tests (`*.test.tsx`) under `tests/unit/`.

## `npm run test:verbose` — step-by-step evidence

Use this to verify that a passing test is actually doing what you think, or to understand why a test is failing. Every step is printed with a ✔ or ✗, and underneath each step the suite logs what it observed: which notes matched, what property values were read from disk, how many notes were changed.

```bash
npm run test:verbose
```

Example output for one scenario:

```
  Scenario: Remove a parent link from all matching notes
    ✔ Given a fresh copy of the test vault
    ✔ When I filter notes where "parent" "exists and contains" "[[Note X]]"
          → 2 matched: Note A, Note D
    ✔ And I apply delete value on property "parent" with value to delete "[[Note X]]"
          → 2 changed, 0 skipped
    ✔ And note "Note A" no longer has "[[Note X]]" in "parent"
          → Note A.parent = ["[[Note Y|Y notes]]","[[Note Z#H1 title|Read more about Note Z]]"]
    ✔ And the YAML of "Note A" is still valid
          → Note A frontmatter keys: raw, data, body
```

## `npm run test:keep` — inspect the vault files

Use this when you want to open the modified notes directly and read the raw YAML, for example to verify that a complex frontmatter transformation produced exactly the right output.

```bash
npm run test:keep
```

Same as verbose mode, but instead of deleting the temporary vault copy after each scenario, the path is printed so you can open the files in any text editor or in Obsidian:

```
  Vault preserved at: /var/folders/.../ov-test-a3f9c2/
```

The temporary directories are not cleaned up automatically when using this mode. Delete them manually when done.


# Coverage

Measuring how much of the code the tests exercise is optional — the suite verifies behaviour with or without it.

## `npm run coverage` — full report

```bash
npm run coverage
```

Runs the whole suite (unit + BDD) under [c8](https://github.com/bcoe/c8) and prints a per-file table plus an HTML report in `coverage/`. Because it includes the BDD run, it measures the heavily-exercised service layer (`filter.ts`, `operations.ts`, …) and lists untested files (routes, UI) at 0% — i.e. a true whole-project picture.

> c8 needs a Node.js **LTS** (20/22). On very new Node versions it can fail to start due to an upstream dependency (yargs) lag; this affects only the coverage *reporter*, never the app or the tests.

## `npm run coverage:unit` — works on any Node

```bash
npm run coverage:unit
```

Uses Node's built-in test-runner coverage. It only measures modules loaded by the unit tests (so it omits the BDD-covered services), but it runs on any supported Node version and needs no extra tooling.


# File layout

```
tests/
├── features/                  ← BDD scenarios (write your scenarios here)
│   ├── filter.feature
│   ├── delete-value.feature
│   ├── add-value.feature
│   ├── replace-value.feature
│   ├── move-value.feature
│   └── steps/                 ← step implementations (rarely need touching)
│       ├── given.steps.ts
│       ├── when.steps.ts
│       └── then.steps.ts
├── fixtures/
│   └── test-vault/            ← committed vault (never modified at runtime)
├── support/
│   ├── world.ts               ← per-scenario state (BDD)
│   ├── hooks.ts               ← Before: copy vault to tmp; After: delete tmp
│   ├── vault-schema.ts        ← property type definitions for the test vault
│   ├── test-setup.mjs         ← jsdom + CSS-import stub for interaction tests
│   └── css-hooks.mjs          ← Node loader hook stubbing `*.css` imports
└── unit/                      ← unit tests (*.test.ts) and interaction tests (*.test.tsx)
```

The vault is copied once **per scenario** — not once per feature file. Every test case gets its own independent directory in the OS temp folder, created just before the scenario runs and deleted immediately after. This means two scenarios in the same feature file can both modify the same note without interfering with each other, because they are each working on a separate copy. The committed fixture in `tests/fixtures/test-vault/` is never modified.



# Writing a new scenario

Add a `.feature` file under `tests/features/` (or append to an existing one).

```gherkin
Feature: Your feature description

  Scenario: A clear sentence describing the behaviour
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply add value on property "related" with value to add "[[New Topic]]"
    Then 2 notes are changed
    And note "Note A" has "[[New Topic]]" in "related"
    And the YAML of "Note A" is still valid
```

## Step vocabulary

#### Given

| Step | Purpose |
|---|---|
| `Given a fresh copy of the test vault` | Always the first step of a scenario |

#### When — filtering

| Step | Purpose |
|---|---|
| `When I filter notes where "prop" "exists and contains" "value"` | Property rule with a value |
| `When I filter notes where "prop" "exists and does not contain" "value"` | Exclusion rule |
| `When I filter notes where "prop" "exists and is empty"` | Property exists but has no value |
| `When I filter notes where "prop" "exists and is not empty"` | Property exists and has a value |
| `When I filter notes where "prop" "exists"` | Property is defined, with or without a value |
| `When I filter notes where "prop" "does not exist"` | Property is absent entirely |
| `When I filter notes in directory "Dir 1"` | Location rule (shorthand for *directory is*) |
| `When I filter notes where directory "is" "Dir 1"` | First location rule (the *Where* row — no combinator) |
| `When I filter notes where directory "is not" "Dir 1"` | First location rule, negated |
| `And combining with "and" where directory "is" "Dir 3"` | A chained location rule with an explicit combinator |
| `And combining with "or" where directory "is not" "Dir 1/Sub"` | A chained location rule with an explicit combinator |

Rules combine **left-to-right**, and each chained rule states its own combinator (`and` / `or`)
— exactly like the AND/OR dropdown on each rule in the GUI. The first rule is the seed, so it
takes no combinator. Because the combinator is explicit, the scenario reads the way it behaves:
for example, two `directory is` rules joined with `and` match nothing (a note cannot be in two
sibling directories at once), whereas joining the second with `or` unions them.

#### When — operations (applied to whatever is currently matched)

| Step | Purpose |
|---|---|
| `When I apply delete value on property "p" with value to delete "v"` | Remove a value |
| `When I apply add value on property "p" with value to add "v"` | Append a value |
| `When I apply replace value on property "p" current value "old" new value "new"` | Replace a value |
| `When I apply move value from property "a" to property "b" value to move "v"` | Move a value between properties |

#### Then — counts

| Step | Purpose |
|---|---|
| `Then {int} notes match` | How many notes passed the filter |
| `Then {int} notes are changed` | Successful operation writes |
| `Then {int} notes fail` | Notes the operation skipped or could not change |

#### Then — per-note assertions (re-reads each note from disk)

| Step | Purpose |
|---|---|
| `Then note "Note A" has "[[New Topic]]" in "related"` | Value is present |
| `Then note "Note A" no longer has "[[Note X]]" in "parent"` | Value is absent |
| `Then note "Note A" has property "time" equal to "13:40"` | Exact scalar match |
| `Then note "Note A" has "number headings" empty` | Property has no value |
| `Then note "Note B" has property "related" and it is empty` | Property has no value (alternate phrasing) |
| `Then the YAML of "Note A" is still valid` | Frontmatter still parses without error |

Property values are compared loosely: `[[Topic A]]` and `Topic A` are treated as equal, and `#tag1` and `tag1` are treated as equal.



# Test vault

The test vault lives at `tests/fixtures/test-vault/`. See the [Test vault](test-vault) document for the full note inventory, property schema, and YAML format details.

To add notes to the vault, create `.md` files anywhere under `tests/fixtures/test-vault/`. They are picked up automatically on the next run.



# Adding new step definitions

If the built-in vocabulary does not cover a new behaviour, add a step to the appropriate file under `tests/features/steps/`:

- `given.steps.ts` — world setup
- `when.steps.ts` — actions (filtering, operations)
- `then.steps.ts` — assertions

Steps call the same service functions the UI uses: `filterByCriteria`, `applyOperation`, `scanVault`. After an operation is applied the step calls `invalidateCache` and re-scans so all subsequent assertions read fresh on-disk state.



# Writing an interaction (component) test

Interaction tests render a React component and assert on its DOM/behaviour. They use `node:test` (so they run in the same pass as the unit tests) plus [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and a jsdom DOM. Put them in `tests/unit/` with a **`.test.tsx`** extension.

```tsx
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ValueInput from '../../src/client/components/ValueInput'

afterEach(cleanup) // unmount between tests so the DOM doesn't leak

test('shows a clear button when there is a value', () => {
  render(<ValueInput value="hello" onChange={() => {}} />)
  assert.ok(screen.getByLabelText('Clear value'))
})
```

How it works under the hood (configured for you, no setup needed):

- `tests/support/test-setup.mjs` is loaded via `node --import`. It registers a global jsdom DOM and a loader hook (`css-hooks.mjs`) that stubs `*.css` imports — components import CSS modules, which Node can't load otherwise. The stub returns the class name itself (so `styles.foo === 'foo'`), which keeps `className` assertions meaningful.
- Prefer querying by what the user perceives — `getByPlaceholderText`, `getByText`, `getByRole`, `getByLabelText` — over implementation details.
- Components are controlled, so pass `value` + `onChange` and assert the callback is invoked (e.g. clearing reports `''`); to test a class toggle, assert `element.className.includes('inputClearHover')`.

# For contributors

A few conventions worth knowing:

- **Pull out pure logic.** Behaviour that can be a plain function (e.g. `addValueStatus`, `deleteValueStatus`, `isValidValueForType`, `sortVaultsActiveFirst`, `parseChangelog`) lives in `src/**` and is unit-tested directly — it's faster and clearer than driving it through the UI. Favour this over component tests when you can.
- **Match the data shape the app uses.** Helpers that read note frontmatter take the real `{ frontmatter: {...} }` note shape; tests should pass that shape, not a bare value (a past bug came from the mismatch).
- **The backend is the authority.** Type/format validation is enforced server-side in `operations.ts`; the client mirrors it via the shared `@shared/properties` helpers for instant feedback. Keep the two in lock-step rather than duplicating rules.
- **Tests are typechecked.** `tests/**` is part of `tsconfig.json`, so `npm run typecheck` covers your tests too.
