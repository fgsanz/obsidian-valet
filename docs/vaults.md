---
title: Vaults
slug: vaults
description: Add and configure vaults, forbidden directories, and property definitions
---

# Vaults

A vault is the root folder of an Obsidian vault on your filesystem. You can configure multiple vaults and switch between them.

## Adding a vault

Go to the **Vaults** page and click **Add vault**. Provide:

- **Name** — a display label, e.g. "Personal" or "Work"
- **Path** — the absolute filesystem path to the vault folder, e.g. `/Users/you/Obsidian/Personal`

## Forbidden directories

Directories listed as forbidden are skipped entirely during scanning. Obsidian's own metadata folders should always be in this list.

Typical defaults: `.obsidian`, `.trash`

Add any other directories you never want to appear in results (e.g. `Archive/Old`, `Templates`).

**Note:** All hidden directories (names starting with `.`) are automatically excluded from scanning, regardless of the forbidden list. This prevents accidental scanning of system and tool metadata directories.

## Property definitions

Property definitions tell the tool how to interpret each frontmatter key. Without a definition, the tool makes a best-effort guess based on the value's shape.

Each property has a **name** (the exact frontmatter key) and a **type**. See [Frontmatter types](frontmatter-types) for the full list.

Defining your properties explicitly gives you correctly typed filter operators and ensures values are compared and serialized as expected.

## Active vault

Only one vault is active at a time. The **Operations** page always operates on the active vault. Switch the active vault from the Vaults page.

## Git integration

If the vault folder contains a git repository, Obsidian Valet will offer to create safety checkpoint commits before and after bulk operations. If the vault is not a git repo, this step is silently skipped. See [Git integration](git-integration).
