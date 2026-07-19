---
title: Metadata filters
slug: metadata-filters
description: All filter operators and type-specific behaviour
---

# Metadata filters

Filters can match notes by:
- **directory** (file location in vault)
- **property** (frontmatter value)

---

## Directory filters

Directory filters match notes by their file location in the vault. Forbidden directories are excluded from the directory selector.

Logical operators:
- **is** — note is in this directory or a subdirectory
- **is not** — note is not in this directory (or any subdirectory)

---

## Property filters

Property filters operates on frontmatter properties.

Logical operators:
| Operation | Description |
| --------- | ----------- |
| **exists and contains** | the property is defined in frontmatter AND the value is included in the value(s) of the property|
| **exists and does not contain** | the property is defined in frontmatter AND the value is not included in the value(s) of the property|
| **exists and is empty** | property is defined in frontmatter but its value is empty (`null`, an empty/blank string `""`, or an empty array `[]`)|
| **exists and is not empty** | the property is defined in frontmatter AND its value is not empty|
| **exists** | the property is defined in frontmatter, regardless of value|
| **does not exist** | the property is not defined in frontmatter at all|

When filtering by a property which is of the types **link** or **link-array**, the expected value syntax is a link, e.g., `[[Note name]]`. The tool validates this syntax and highlights invalid entries in red.

### Case sensitivity

You can toggle case-sensitive matching using the **Aa** button on each rule:
- Dimmed **Aa** (default) — case-insensitive matching
- Bold **Aa** — case-sensitive matching

### Operators by property type

#### Link and link-array

| Operator | Meaning |
|----------|---------|
| contains link to | Any element in the array matches the target (by note name or alias) |
| does not contain link to | No element matches |
| is exactly | The single value equals the target |
| is not | The single value does not equal the target |

Link matching strips `[[` `]]` brackets and the `|alias` suffix, then compares case-insensitively. Querying with or without brackets works the same.

#### Tag-array

| Operator | Meaning |
|----------|---------|
| has tag | Any element starts with the query (matches subtags) |
| does not have tag | No element starts with the query |

Querying `tag2` matches both `tag2` and `tag2/subtag`.

#### Text and text-array

| Operator | Meaning |
|----------|---------|
| is | Exact case-insensitive match |
| is not | Does not match exactly |
| contains | Case-insensitive substring match |
| does not contain | Substring not found |

#### Date (YYYY-MM-DD)

| Operator | Meaning |
|----------|---------|
| is | Exact date match |
| is not | Not this date |
| is before | Date is earlier than the query |
| is after | Date is later than the query |

Enter dates in `YYYY-MM-DD` format.

#### Week-link ([[YYYY-Www]])

| Operator | Meaning |
|----------|---------|
| is week | Exact week match |
| is not week | Not this week |
| is before week | Week is earlier |
| is after week | Week is later |

Enter values in `[[YYYY-Www]]` format, e.g. `[[2026-W22]]`.

#### Number

| Operator | Meaning |
|----------|---------|
| = | Equal |
| ≠ | Not equal |
| < | Less than |
| > | Greater than |

#### Boolean

| Operator | Meaning |
|----------|---------|
| is | Equals true or false |
| is not | Does not equal |

---

## Combining rules

Rules after the first have a combinator:

- **AND** — the note must also match this rule (intersection)
- **OR** — notes matching this rule are added to the result set (union)

AND takes left-to-right precedence. There is no grouping syntax; use separate filter runs for complex logic.
