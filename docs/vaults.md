---
title: Vaults
slug: vaults
description: Add and configure vaults, forbidden directories, and property definitions
---

# Vaults

A vault is the root folder of an Obsidian vault on your filesystem. You can configure multiple vaults and switch between them.

## Forbidden directories

Directories listed as forbidden are skipped entirely during scanning. Add any directories you never want to appear in results (e.g. `Administration`, `Private`).

> **Note:** All hidden directories (names starting with `.`) are automatically excluded from scanning, regardless of the forbidden list. This prevents accidental scanning of system and tool metadata directories.

## Property definitions

Property definitions tell the tool how to interpret each frontmatter key. Obsidian Valet picks up the properties information from each vault. See [Frontmatter types](frontmatter-types) for details.

## Active vault

Only one vault is active at a time. The **Metadata** page always operates on the active vault.

## Git integration

If the vault folder contains a git repository, Obsidian Valet will offer to create safety checkpoint commits before and after bulk operations. If the vault is not a git repo, this step is silently skipped. See [Git integration](git-integration).
