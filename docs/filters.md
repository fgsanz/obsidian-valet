---
title: Filters
slug: filters
---

# Filters

Filters test frontmatter property values. The available operators depend on the property type.

## Operators by type

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
