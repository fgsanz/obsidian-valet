---
title: Testing
slug: testing
description: BDD test suite — running tests, writing scenarios, step vocabulary
---

# Testing

Obsidian Valet has a BDD test suite driven by [Cucumber.js](https://cucumber.io/docs/cucumber/) and written in Gherkin. Tests run in-process against the real filter/operation services — no HTTP server is needed.


# Running the suite

Cucumber picks up [`cucumber.mjs`](../cucumber.mjs) automatically and runs every `.feature` file under `tests/features/`.

## `npm test` — fast mode

The default. Use this during normal development to get a quick pass/fail signal.

```bash
npm test
```

Output is a compact progress bar (`.` per passing step, `F` per failure) followed by a summary. On failure the full assertion diff is printed:

```
AssertionError: Expected 2 matching notes but got 3: Alpha, Beta, Gamma
  at Then(2 notes match) in then.steps.ts:36
  in Scenario: Filter by a link property  (filter.feature:5)
```

## `npm run test:verbose` — step-by-step evidence

Use this to verify that a passing test is actually doing what you think, or to understand why a test is failing. Every step is printed with a ✔ or ✗, and underneath each step the suite logs what it observed: which notes matched, what property values were read from disk, how many notes were changed.

```bash
npm run test:verbose
```

Example output for one scenario:

```
  Scenario: Remove a parent link from all matching notes
    ✔ Given a fresh copy of the test vault
    ✔ When I filter notes where "parent" "contains" "[[Note X]]"
          → 2 matched: Note A, Note D
    ✔ And I apply delete-value on property "parent" with value "[[Note X]]"
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


# File layout

```
tests/
├── features/                  ← write your scenarios here
│   ├── filter.feature
│   ├── delete-value.feature
│   ├── add-value.feature
│   └── steps/                 ← step implementations (rarely need touching)
│       ├── given.steps.ts
│       ├── when.steps.ts
│       └── then.steps.ts
├── fixtures/
│   └── test-vault/            ← committed vault (never modified at runtime)
└── support/
    ├── world.ts               ← per-scenario state
    ├── hooks.ts               ← Before: copy vault to tmp; After: delete tmp
    └── vault-schema.ts        ← property type definitions for the test vault
```

The vault is copied once **per scenario** — not once per feature file. Every test case gets its own independent directory in the OS temp folder, created just before the scenario runs and deleted immediately after. This means two scenarios in the same feature file can both modify the same note without interfering with each other, because they are each working on a separate copy. The committed fixture in `tests/fixtures/test-vault/` is never modified.



# Writing a new scenario

Add a `.feature` file under `tests/features/` (or append to an existing one).

```gherkin
Feature: Your feature description

  Scenario: A clear sentence describing the behaviour
    Given a fresh copy of the test vault
    When I filter notes where "parent" "contains" "[[ProjectX]]"
    And I apply add-value on property "related" with value "[[ProjectZ]]"
    Then 2 notes are changed
    And note "Alpha" has "[[ProjectZ]]" in "related"
    And the YAML of "Alpha" is still valid
```

## Step vocabulary

#### Given

| Step | Purpose |
|---|---|
| `Given a fresh copy of the test vault` | Always the first step of a scenario |

#### When — filtering

| Step | Purpose |
|---|---|
| `When I filter notes where "prop" "contains" "value"` | Property rule with a value |
| `When I filter notes where "prop" "does not contain" "value"` | Exclusion rule |
| `When I filter notes where "prop" "is empty"` | Property exists but has no value |
| `When I filter notes where "prop" "does not exist"` | Property is absent entirely |
| `When I filter notes in directory "Projects"` | Location rule |

Multiple `When`/`And` filter steps combine with AND logic.

#### When — operations (applied to whatever is currently matched)

| Step | Purpose |
|---|---|
| `When I apply delete-value on property "p" with value "v"` | Remove a value |
| `When I apply add-value on property "p" with value "v"` | Append a value |
| `When I apply replace on property "p" from "old" to "new"` | Replace a value |
| `When I apply move on value "v" from property "a" to property "b"` | Move a value between properties |

#### Then — counts

| Step | Purpose |
|---|---|
| `Then {int} notes match` | How many notes passed the filter |
| `Then {int} notes are changed` | Successful operation writes |
| `Then {int} notes fail` | Notes the operation skipped or could not change |

#### Then — per-note assertions (re-reads each note from disk)

| Step | Purpose |
|---|---|
| `Then note "Alpha" has "[[ProjectZ]]" in "related"` | Value is present |
| `Then note "Alpha" no longer has "[[ProjectX]]" in "parent"` | Value is absent |
| `Then note "Health" has property "date" equal to "2026-03-01"` | Exact scalar match |
| `Then the YAML of "Alpha" is still valid` | Frontmatter still parses without error |

Property values are compared loosely: `[[ProjectX]]` and `ProjectX` are treated as equal, and `#active` and `active` are treated as equal.



# Test vault

The test vault lives at `tests/fixtures/test-vault/`. See the [Test vault](test-vault) document for the full note inventory, property schema, and YAML format details.

To add notes to the vault, create `.md` files anywhere under `tests/fixtures/test-vault/`. They are picked up automatically on the next run.



# Adding new step definitions

If the built-in vocabulary does not cover a new behaviour, add a step to the appropriate file under `tests/features/steps/`:

- [given.steps.ts](../tests/features/steps/given.steps.ts) — world setup
- [when.steps.ts](../tests/features/steps/when.steps.ts) — actions (filtering, operations)
- [then.steps.ts](../tests/features/steps/then.steps.ts) — assertions

Steps call the same service functions the UI uses: `filterByCriteria`, `applyOperation`, `scanVault`. After an operation is applied the step calls `invalidateCache` and re-scans so all subsequent assertions read fresh on-disk state.
