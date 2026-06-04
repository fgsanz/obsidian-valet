---
title: Test vault
slug: test-vault
description: Note inventory, property schema, and YAML format for the BDD test fixture
---

# Test vault

The test vault is a small, hand-crafted collection of notes used by the BDD test suite. It lives at `tests/fixtures/test-vault/` and is the committed source fixture — it is never modified at runtime. Before each scenario, the suite copies it into a throwaway directory in the OS temp folder; after the scenario that copy is deleted. See [Testing](testing) for how to write and run test cases.

The notes are designed to exercise as many property types, value formats, and edge cases as possible in a compact set. The two structural variants (collapsed vs. expanded YAML) ensure that formatting differences do not affect parsing or filtering.

---

## Frontmatter properties

| Name            | Type       |
| --------------- | ---------- |
| tags            | text-array |
| aliases         | text-array |
| date            | date       |
| week            | week-link  |
| time            | text       |
| read            | boolean    |
| number headings | text       |
| parent          | link-array |
| related         | link-array |

---

## Test vault

- Two triplets of notes {A,B,C} and {D,E,F} in two different directory structures
- The following notes are identical in content: {A,D}, {B,E}, {C,F}
- In notes {A,B,C} the YAML format is collapsed
- In notes {D,E,F} the YAML format is expanded
- Two notes with extreme corner cases: {no frontmatter,empty frontmatter}
- Different property types are exercised: {text, text-array, link-array, date, boolean, week-link}
- Different property scenarios are exercised: {define with value, define and empty, undefined}
- Within the values, different link values are exercised: {name with spaces, name + alias, name + chapter + alias}
- Within the values, different boolean values are exercised: {true, false, undefined}

| Path                          | Filename             | YAML        | YAML format | tags (text-array)                      | aliases (text-array) | date (date) | week (week-link) | time (text) | read (boolean) | number headings (text)                         | parent (link-array)                                                                    | related (link-array)                            |
| ----------------------------- | -------------------- | ----------- | ----------- | -------------------------------------- | -------------------- | ----------- | ---------------- | ----------- | -------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Dir 1                         | Note A               | yes         | Collapsed   | `#tag1`<br>`#tag2`<br>`#tag3/subtag3a` | `alias 1`, `alias 2` | 2025-12-31  | `"[[2025-W52]]"` | 13:40       | true           | auto, first-level 1, max 3, contents ^toc, 1.1 | `["[[Note X]]", "[[Note Y\|Y notes]]", "[[Note Z#H1 title\|Read more about Note Z]]"]` | `["[[Topic A]]", "[[Topic B]]", "[[Topic C]]"]` |
| Dir 1/Subdir 1.1              | Note B               | yes         | Collapsed   | `#tag1`<br>`#tag3/subtag3b`            | `alias 1`, `alias 3` | 2026-01-01  | `"[[2026-W01]]"` | (empty)     | false          | (empty)                                        | (undefined)                                                                            | (empty)                                         |
| Dir 1/Subdir 1.1/Subdir 1.1.1 | Note C               | yes         | Collapsed   | (undefined)                            | `alias 1`            | 2026-01-02  | (undefined)      | (undefined) | (undefined)    | (undefined)                                    | (undefined)                                                                            | (undefined)                                     |
| Dir 2                         | Note D               | yes         | Expanded    | `#tag1`<br>`#tag2`<br>`#tag3/subtag3a` | `alias 1`, `alias 2` | 2025-12-31  | `"[[2025-W52]]"` | 13:40       | true           | auto, first-level 1, max 3, contents ^toc, 1.1 | `["[[Note X]]", "[[Note Y\|Y notes]]", "[[Note Z#H1 title\|Read more about Note Z]]"]` | `["[[Topic A]]", "[[Topic B]]", "[[Topic C]]"]` |
| Dir 2/Subdir 2.1              | Note E               | yes         | Expanded    | `#tag1`<br>`#tag3/subtag3b`            | `alias 1`, `alias 3` | 2026-01-01  | `"[[2026-W01]]"` | (empty)     | false          | (empty)                                        | (undefined)                                                                            | (empty)                                         |
| Dir 2/Subdir 2.1/Subdir 2.1.1 | Note F               | yes         | Expanded    | (undefined)                            | `alias 1`            | 2026-01-02  | (undefined)      | (undefined) | (undefined)    | (undefined)                                    | (undefined)                                                                            | (undefined)                                     |
| Dir 3                         | Note with empty YAML | (empty)     | N/A         | (undefined)                            | (undefined)          | (undefined) | (undefined)      | (undefined) | (undefined)    | (undefined)                                    | (undefined)                                                                            | (undefined)                                     |
| Dir 3                         | Note without YAML    | (undefined) | (undefined) | (undefined)                            | (undefined)          | (undefined) | (undefined)      | (undefined) | (undefined)    | (undefined)                                    | (undefined)                                                                            | (undefined)                                     |

---

# Frontmatter format

Same content, two different YAML formats.

## Collapsed YAML

```
---
tags: [tag1, tag2, tag3/subtag3a, tag3/subtag3b]
aliases: [alias 1, alias 2]
date: 2025-09-22
week: "[[2025-W39]]"
time: 13:40
read: true
number headings: auto, first-level 1, max 3, contents ^toc, 1.1
parent: ["[[Note X]]", "[[Note Y|Y notes]]", "[[Note Z#H1 title|Read more about Note Z]]"]
related: ["[[Topic A]]", "[[Topic B]]", "[[Topic C]]"]
---
```

## Expanded YAML

```
tags:
  - tag1
  - tag2
  - tag3/subtag3a
aliases:
  - alias 1
  - alias 2
date: 2025-12-31
week: "[[2025-W52]]"
time: 13:40
read: true
number headings: auto, first-level 1, max 3, contents ^toc, 1.1
parent:
  - "[[Note X]]"
  - "[[Note Y|Y notes]]"
  - "[[Note Z#H1 title|Read more about Note Z]]"
related:
  - "[[Topic A]]"
  - "[[Topic B]]"
  - "[[Topic C]]"
```
