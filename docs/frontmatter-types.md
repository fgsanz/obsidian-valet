---
title: Frontmatter types
slug: frontmatter-types
description: How each property type is stored and matched
---

# Frontmatter types

**Frontmatter** is the top section of a note and it contains properties. Each property definition has a type that determines how values are parsed, compared, and written back.

## text

A single string. Stored as a YAML scalar.

```yaml
icon: LiBox
```

## text-array

A list of strings. A single string value is coerced to a one-element list.

```yaml
aliases:
  - some alias name 1
  - some alias name 2
```

## number

A numeric value. Stored as a YAML number.

```yaml
priority: 3
```

## boolean

True or false. Stored as a YAML boolean.

```yaml
published: true
```

## date

A date in `YYYY-MM-DD` format. Stored as a quoted string to prevent YAML date auto-conversion.

```yaml
date: 2026-05-31
```

## week-link

A week reference in `[[YYYY-Www]]` format. The link points to a weekly note.

```yaml
week: "[[2026-W22]]"
```

## tag-array

A list of Obsidian tags, each starting with `#`. Subtags use `/` as a separator.

```yaml
tags:
  - "#tag1"
  - "#tag2/subtag"
```

Internally, tags are stored without the `#` prefix. When written back, the `#` is re-added.

## link

A single Obsidian wiki link. Aliases after `|` are preserved.

```yaml
parent: "[[Note Name]]"
```

## link-array

A list of Obsidian wiki links.

```yaml
parent:
  - "[[Obsidian]]"
  - "[[Scripting]]"
related:
  - "[[AI]]"
  - "[[5G Core|5GC]]"
```

Link matching during filtering strips brackets and the `|alias` suffix, then compares case-insensitively. You can query with or without `[[]]` brackets.
