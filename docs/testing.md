---
title: Testing
slug: testing
description: BDD test suite — running tests, writing scenarios, step vocabulary
---

# Testing

Obsidian Valet has a BDD test suite driven by [Cucumber.js](https://cucumber.io/docs/cucumber/) and written in Gherkin. Tests run in-process against the real filter/operation services — no HTTP server is needed.

---

## Running the suite

```bash
npm test
```

Cucumber picks up [`cucumber.mjs`](../cucumber.mjs) automatically and runs every `.feature` file under `tests/features/`.

---

## Reading the results

Output has two layers:

- A live **progress bar** as steps execute (`.` = passed, `F` = failed)
- A **summary** at the end with scenario/step counts and the full diff of any failure

A failure looks like:

```
AssertionError: Expected 2 matching notes but got 3: Alpha, Beta, Gamma
  at Then(2 notes match) in then.steps.ts:36
  in Scenario: Filter by a link property  (filter.feature:5)
```

---

## File layout

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
│   └── dummy-vault/           ← committed vault (never modified at runtime)
│       ├── Projects/          Alpha.md, Beta.md, Gamma.md
│       ├── Areas/             Health.md
│       ├── Inbox/             Scratch.md
│       └── People/            Jordan.md
└── support/
    ├── world.ts               ← per-scenario state
    ├── hooks.ts               ← Before: copy vault to tmp; After: delete tmp
    └── vault-schema.ts        ← property type definitions for the dummy vault
```

Each scenario automatically gets a **fresh throwaway copy** of the dummy vault in the OS temp directory. The committed fixture is never modified. You don't manage setup or teardown.

---

## Writing a new scenario

Add a `.feature` file under `tests/features/` (or append to an existing one).

```gherkin
Feature: Your feature description

  Scenario: A clear sentence describing the behaviour
    Given a fresh copy of the dummy vault
    When I filter notes where "parent" "contains" "[[ProjectX]]"
    And I apply add-value on property "related" with value "[[ProjectZ]]"
    Then 2 notes are changed
    And note "Alpha" has "[[ProjectZ]]" in "related"
    And the YAML of "Alpha" is still valid
```

### Step vocabulary

**Given**

| Step | Purpose |
|---|---|
| `Given a fresh copy of the dummy vault` | Always the first step of a scenario |

**When — filtering**

| Step | Purpose |
|---|---|
| `When I filter notes where "prop" "contains" "value"` | Property rule with a value |
| `When I filter notes where "prop" "does not contain" "value"` | Exclusion rule |
| `When I filter notes where "prop" "is empty"` | Property exists but has no value |
| `When I filter notes where "prop" "does not exist"` | Property is absent entirely |
| `When I filter notes in directory "Projects"` | Location rule |

Multiple `When`/`And` filter steps combine with AND logic.

**When — operations** (applied to whatever is currently matched)

| Step | Purpose |
|---|---|
| `When I apply delete-value on property "p" with value "v"` | Remove a value |
| `When I apply add-value on property "p" with value "v"` | Append a value |
| `When I apply replace on property "p" from "old" to "new"` | Replace a value |
| `When I apply move on value "v" from property "a" to property "b"` | Move a value between properties |

**Then — counts**

| Step | Purpose |
|---|---|
| `Then {int} notes match` | How many notes passed the filter |
| `Then {int} notes are changed` | Successful operation writes |
| `Then {int} notes fail` | Notes the operation skipped or could not change |

**Then — per-note assertions** (re-reads each note from disk)

| Step | Purpose |
|---|---|
| `Then note "Alpha" has "[[ProjectZ]]" in "related"` | Value is present |
| `Then note "Alpha" no longer has "[[ProjectX]]" in "parent"` | Value is absent |
| `Then note "Health" has property "date" equal to "2026-03-01"` | Exact scalar match |
| `Then the YAML of "Alpha" is still valid` | Frontmatter still parses without error |

Property values are compared loosely: `[[ProjectX]]` and `ProjectX` are treated as equal, and `#active` and `active` are treated as equal.

---

## Dummy vault contents

| Note | parent | related | tags | date | status | aliases |
|---|---|---|---|---|---|---|
| Projects/Alpha | `[[ProjectX]]` | `[[Beta]]` | `#active` `#project` | 2026-01-15 | in-progress | — |
| Projects/Beta | `[[ProjectX]]` | — | `#active` | — | in-progress | — |
| Projects/Gamma | `[[ProjectY]]` | `[[Alpha]]` | `#archived` | — | done | — |
| Areas/Health | — | — | `#area` | 2026-03-01 | active | — |
| Inbox/Scratch | — (no frontmatter) | — | — | — | — | — |
| People/Jordan | — | `[[Alpha]]` | `#person` `#colleague` | — | — | `Jordan Lee`, `J. Lee` |

To add notes to the vault, create `.md` files under `tests/fixtures/dummy-vault/`. They are picked up automatically on the next run.

---

## Adding new step definitions

If the built-in vocabulary does not cover a new behaviour, add a step to the appropriate file under `tests/features/steps/`:

- [given.steps.ts](../tests/features/steps/given.steps.ts) — world setup
- [when.steps.ts](../tests/features/steps/when.steps.ts) — actions (filtering, operations)
- [then.steps.ts](../tests/features/steps/then.steps.ts) — assertions

Steps call the same service functions the UI uses: `filterByCriteria`, `applyOperation`, `scanVault`. After an operation is applied the step calls `invalidateCache` and re-scans so all subsequent assertions read fresh on-disk state.
