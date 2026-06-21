---
title: Getting started
slug: getting-started
description: A quick welcome and the two ways to start using Obsidian Valet
---

# Getting started

Welcome! 👋 

Obsidian Valet is here to take the tedious chores off your plate so you can spend your time thinking and writing, not wrangling frontmatter.

A quick note on **philosophy**...
> Obsidian Valet is **not** meant to replace your thinking. It won't advise *what* your notes should say or how to connect them — it's designed to make the **administrative** side of your vault (bulk-editing properties across many notes) faster, safer, and far less tedious.

Getting started is easy. There are two ways to set it up, depending on whether you want the safety net of a **Git snapshot** before each change.

## Without Git

The simplest way: point Obsidian Valet at your vault, filter notes, and apply changes directly. No extra setup — just you and your vault.

<img class="theme-light-only" src="/api/docs/resources/gs-without-git-light.png" alt="Getting started without Git: Obsidian Valet edits the vault directly" />
<img class="theme-dark-only" src="/api/docs/resources/gs-without-git-dark.png" alt="Getting started without Git: Obsidian Valet edits the vault directly" />

This is perfect for getting a feel for the tool. The trade-off: there's no automatic way to undo a bulk operation, so changes are applied straight to your notes. See [Without Git integration](without-git-integration) for what this means.

## With Git (recommended)

Make your vault a Git repository and Obsidian Valet adds a safety net: it takes a **snapshot before** every operation and lets you **commit or revert** afterwards — entirely on your computer, no GitHub account needed.

<img class="theme-light-only" src="/api/docs/resources/gs-with-git-light.png" alt="Getting started with Git: Obsidian Valet takes a snapshot before each operation" />
<img class="theme-dark-only" src="/api/docs/resources/gs-with-git-dark.png" alt="Getting started with Git: Obsidian Valet takes a snapshot before each operation" />

If a bulk change isn't what you expected, you can roll back to the snapshot in one click. See [Add Git to your vault](git-setup) to set this up and [With Git integration](git-integration) for how the snapshot / commit / revert flow works.

---

Ready? Head to [Vaults](vaults) to add your vault, then to the **Metadata** page to filter notes and apply your first operation.
