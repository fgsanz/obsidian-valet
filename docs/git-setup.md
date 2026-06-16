---
title: Add Git to your vault
slug: git-setup
description: Add local Git to a vault, keep it offline, and combine it with Obsidian Sync
---

# Add Git to your vault

Obsidian Valet uses [Git](https://git-scm.com/) to take a safety snapshot before a bulk operation and to let you commit or revert the changes afterwards (see [With Git integration](git-integration)). This page explains how to add Git to a vault, why it works **entirely on your computer** without any cloud account, and how it lives happily alongside Obsidian Sync — even across several devices.

---

## Add Git to your vault

A vault is just a folder of Markdown files, so turning it into a Git repository is easy.

Initialize Git in your vault:

```sh
cd "/path/to/your/vault"
git init
```

### Recommended `.gitignore`

Likely, you consume the same Obsidian vault in different devices (e.g., laptop, phone). Obsidian stores per-device UI state info inside the `.obsidian` folder. You usually do **not** want that churn in your history.

Create a `.gitignore` file in the root of the vault and add the following content:

```
# Obsidian local/workspace state
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
.trash/

# OSX noise (if you use MacOS)
.DS_Store

# If you use Smart plugins (Connections, Context, Lookup, ...)
.smart-env
```

Keep the rest of `.obsidian` (your plugins and settings) tracked if you want them versioned, or ignore the whole folder if you only care about note content. Just consider that keeping track of changes in plugins and settings might come in handy some day.

### Enable tracking

Enable tracking of your note files:

```sh
git add -A
git commit -m "Initial snapshot of the vault"
```

That's it. The vault is now version-controlled. From this point on, Obsidian Valet will detect the repository and offer the snapshot/commit/revert steps automatically.

---

## Git is fully local — no GitHub or GitLab needed

A common misconception is that Git requires an online account. It does not. Git is a **local** version-control system: every commit is stored in the hidden `.git` folder inside your vault, on your own disk.

- You **never have to run** `git push`, and you don't need GitHub, GitLab, or any server.
- All of your history, snapshots, and the ability to revert live offline, in the vault folder.
- Pushing to a remote is an *optional* extra (off-site backup or sharing) — it changes nothing about how Valet's snapshot/revert features work.

In other words, Git here is best thought of as a **private, local "time machine"** for your notes: a safety net for bulk edits, not a cloud service.

---

## Git and Obsidian Sync coexist safely

Obsidian Sync is not affected by the snapshot/commit/revert Git functionality:

- **Sync moves the note content; Git records it.** A bulk operation writes to the `.md` files on disk. Obsidian Sync then propagates those edited files to your other devices exactly as it would for any manual edit. Git's snapshot is independent of that.

A couple of practical tips so the two stay out of each other's way:

- **Don't sync the** `.git` **folder.** The history only needs to exist on the machine that runs Git. Obsidian Sync ignores `.git` by default; if you use a file-level sync tool (Dropbox/iCloud), exclude `.git` from it to avoid syncing a large, machine-specific folder.
- **Let one side own the writes at a time.** Apply a bulk operation when the vault isn't mid-sync, so Sync sees a finished, consistent set of files. In practice this is automatic — operations are fast and Sync simply picks up the result.

Because Git never modifies your notes on its own (it only *reads* them to snapshot, and only *rewrites* them when you explicitly revert), it cannot corrupt or fight with Sync.

---

## One computer runs Git + Valet; the others just sync

You do **not** need Git or Obsidian Valet on every device. The recommended setup is:

### The "workbench" computer

Pick one computer (typically a desktop or laptop) to be your maintenance machine. On it:

- Keep a full **local copy of the vault** (the same vault your other devices sync to).
- Install **Git** and run **Obsidian Valet** there.
- Do all your bulk edits here: filter notes, apply operations, take a git snapshot before, and commit or revert after.

### Every other device (laptops, tablet, phone)

- Run **only Obsidian + Obsidian Sync**. No Git, no Valet, no terminal.
- They receive the results of your bulk operations through normal sync, just like any edit you'd make by hand.

### How a change flows

1. On the workbench computer, you run a bulk operation in Obsidian Valet.
2. Valet takes a **git snapshot** beforehand (your local rollback point) and writes the changes to the `.md` files.
3. **Obsidian Sync** detects the edited notes and propagates them to your phone and other computers.
4. If you don't like the result, you **revert** on the workbench computer; Sync then pushes the restored files back out everywhere.

The other devices never know Git is involved — they only ever see ordinary note files arriving through Sync. All the version-control power stays on the single machine that needs it.

---

## Summary

- `git init` once in the vault folder is all it takes to enable Valet's safety features.
- Git is **local**: no GitHub/GitLab account, no `git push` required.
- Git and Obsidian Sync don't conflict — Git only snapshots on demand and never edits notes on its own (except an explicit revert).
- Keep Git + Obsidian Valet on **one** computer; everything else just runs Obsidian Sync and receives the results.
