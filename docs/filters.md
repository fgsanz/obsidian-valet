---
title: Filters
slug: filters
---

# Filters

Filters can match notes by **property** (frontmatter value) or by **directory** (file location in vault).

## Filter types

### Property filters

Property filters test frontmatter values. Four operators are available:

- **contains** — match notes where the property value includes the query (requires a value)
- **does not contain** — match notes where the property value does not include the query (requires a value)
- **exists and is empty** — match notes where the property is defined in frontmatter but has an empty or null value
- **does not exist** — match notes where the property is not defined in frontmatter at all

For **link and link-array** properties with `contains` or `does not contain`, provide the link in `[[Note Name]]` syntax. The tool validates this syntax and highlights invalid entries in red. Matching strips brackets and aliases, then compares case-insensitively.

For other property types, type-specific placeholders guide entry (e.g., `tag/subtag` for tags, `[[YYYY-Www]]` for week links).

### Directory filters

Directory filters match notes by their file location in the vault:

- **is** — note is in this directory or a subdirectory
- **is not** — note is not in this directory (or any subdirectory)

Forbidden directories are excluded from the directory selector.

## Matching behavior by type

### Link and link-array

| Operator | Meaning |
|----------|---------|
| contains link to | Any element in the array matches the target (by note name or alias) |
| does not contain link to | No element matches |
| is exactly | The single value equals the target |
| is not | The single value does not equal the target |

Link matching strips `[[` `]]` brackets and the `|alias` suffix, then compares case-insensitively. Querying with or without brackets works the same.

### Tag-array

| Operator | Meaning |
|----------|---------|
| has tag | Any element starts with the query (matches subtags) |
| does not have tag | No element starts with the query |

Querying `tag2` matches both `tag2` and `tag2/subtag`.

### Text and text-array

| Operator | Meaning |
|----------|---------|
| is | Exact case-insensitive match |
| is not | Does not match exactly |
| contains | Case-insensitive substring match |
| does not contain | Substring not found |

### Date (YYYY-MM-DD)

| Operator | Meaning |
|----------|---------|
| is | Exact date match |
| is not | Not this date |
| is before | Date is earlier than the query |
| is after | Date is later than the query |

Enter dates in `YYYY-MM-DD` format.

### Week-link ([[YYYY-Www]])

| Operator | Meaning |
|----------|---------|
| is week | Exact week match |
| is not week | Not this week |
| is before week | Week is earlier |
| is after week | Week is later |

Enter values in `[[YYYY-Www]]` format, e.g. `[[2026-W22]]`.

### Number

| Operator | Meaning |
|----------|---------|
| = | Equal |
| ≠ | Not equal |
| < | Less than |
| > | Greater than |

### Boolean

| Operator | Meaning |
|----------|---------|
| is | Equals true or false |
| is not | Does not equal |

## Combining rules

Rules after the first have a combinator:

- **AND** — the note must also match this rule (intersection)
- **OR** — notes matching this rule are added to the result set (union)

AND takes left-to-right precedence. There is no grouping syntax; use separate filter runs for complex logic.

## Null values

A property that is absent from a note's frontmatter or has a `null` / `~` value is treated as "not present". `contains` and `equals` against a null value return false; `not-contains` and `not-equals` return true.
