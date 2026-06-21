---
title: Obsidian scenarios
slug: obsidian-scenarios
description: Common Obsidian setups (single device, with sync, with cloud storage) and where Obsidian Valet fits
---

# Obsidian scenarios

These document below assume that you choose to use Obsidian Valet along [With Git integration](git-integration) to provide a seamless and safe rollback capability. If you are not planning to enable Git, go ahead and skip this document.

Every Obsidian user setps up the vault environment a little differently — one computer or several, with or without sync, with the vault on a local disk or inside a cloud-storage folder. This page walks through three common setups, describes them in a way that is **operating-system-agnostic** (Windows, macOS and Linux), and shows where Obsidian Valet fits in each.

A quick reminder of the moving parts:

- **Obsidian** — the app you read and edit notes in (desktop and mobile).
- **Obsidian Valet** — the bulk-metadata tool; it runs on a computer and operates on a local copy of the vault.
- **Git** — an optional, fully local safety net for snapshots and rollback (see [With Git integration](git-integration)).
- **Obsidian Sync** — Obsidian's own service that keeps the same vault in sync across your devices.

## Scenario 1 — A single device

<img class="theme-light-only" src="/api/docs/resources/setup1_light.png?v=2" alt="A single laptop running Obsidian, Obsidian Valet and Git" />
<img class="theme-dark-only" src="/api/docs/resources/setup1_dark.png?v=4" alt="A single laptop running Obsidian, Obsidian Valet and Git" />

The simplest case: one computer holds the vault and runs everything. Obsidian Valet operates directly on that local vault, and Git (on the same machine) provides snapshots and one-click rollback. There is no sync to think about — what you change is what you have.

This is the ideal setup to get comfortable with Obsidian Valet.

## Scenario 2 — A computer and a phone, kept in sync

<img class="theme-light-only" src="/api/docs/resources/setup2_light.png?v=2" alt="A laptop with Obsidian, Obsidian Valet and Git, and a phone with Obsidian, kept in sync by Obsidian Sync" />
<img class="theme-dark-only" src="/api/docs/resources/setup2_dark.png?v=4" alt="A laptop with Obsidian, Obsidian Valet and Git, and a phone with Obsidian, kept in sync by Obsidian Sync" />

Here a laptop runs Obsidian + Obsidian Valet + Git, while a phone runs only Obsidian. **Obsidian Sync** propagates the vault between them.

Obsidian Valet and Git live on the **laptop only** — think of it as your "workbench". You run bulk operations there; Obsidian Sync then carries the edited notes to your phone like any other change. The phone never needs Valet, Git, or a terminal. See [With Git integration](git-integration) for how the snapshot / commit / revert flow works on the workbench machine.

## Scenario 3 — Several computers, with a vault inside cloud storage

<img class="theme-light-only" src="/api/docs/resources/setup3_light.png?v=2" alt="Two laptops and a phone synced by Obsidian Sync, where one laptop keeps the vault inside a cloud-storage folder" />
<img class="theme-dark-only" src="/api/docs/resources/setup3_dark.png?v=4" alt="Two laptops and a phone synced by Obsidian Sync, where one laptop keeps the vault inside a cloud-storage folder" />

A richer setup: Laptop A (Obsidian + Valet + Git on a local vault), Laptop B where the vault lives **inside a cloud-storage folder** (Obsidian + Valet, **no Git**), a phone with Obsidian, and everything kept together by Obsidian Sync.

Obsidian Valet can run on either laptop and operate on its local copy.

The thing to watch is Laptop B:
- Git is not running on this laptop, because **running Git inside a live cloud-storage folder is problematic** and can fail or even corrupt the repository
- On this machine, it is best if Obsidian Valet runs **without** Git (see [Without Git integration](without-git-integration)); alternatively, if you choose to run Git on a cloud-storage location, follow the workaround in [Git and cloud-storage](git-cloud-storage) to prevent Git from failing.
