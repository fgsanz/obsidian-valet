---
title: Operation rollback
slug: operation-rollback
description: Undo an applied operation by hand using standard git commands
---

# Operation rollback

When the vault is a git repository, the easiest way to undo an operation is the built-in **Revert changes** action (see [With Git integration](git-integration)).

For anything the UI doesn't cover — or to roll back to an older state — you can fall back to standard git commands in the vault directory. **How you undo depends on whether you already committed the operation**, so first check the state:

```sh
git status
git log --oneline
```

## Case A — operation applied but not committed (the usual case)

Right after **Apply changes**, the new values are written to your notes but **not committed yet**: `git status` shows modified files, and the latest commit is a `[Obsidian Valet] Before: …` safety snapshot. For example:

```
bc2919a (HEAD -> main) [Obsidian Valet] Before: delete, property: aliases, value: alias 1
878cb27 [Obsidian Valet] After: 2 operations - delete, property: aliases, value: alias 3 - delete, property: date, value: 2026-01-01
abaa660 Initial snapshot of the vault
```

To undo the operation, **discard the uncommitted changes** so your notes return to the snapshot:

```sh
git restore .
```

(equivalently, `git reset --hard HEAD`). This is exactly what the in-app **Revert changes** action does.

> ⚠️ Do **not** use `git revert HEAD` in this state. The operation's changes are still uncommitted, so git refuses to overwrite them (*"Your local changes … would be overwritten by merge. Aborting"*). `git revert` is only for changes that were already committed — see Case B.

## Case B — operation applied and committed

If you used **Commit changes**, the latest commit is a `[Obsidian Valet] After: …` commit and `git status` is clean. Undo it with either of these:

```sh
git revert HEAD
```

which creates a new commit that reverses the last one, or drop that commit entirely and return to the snapshot taken before it:

```sh
git reset --hard HEAD~1
```

## Roll back to an older snapshot

To jump to any earlier state, hard-reset to its commit hash — this also discards any uncommitted changes. In the example above, to return to `Initial snapshot of the vault`:

```sh
git reset --hard abaa660
```

If the vault is not a git repository (see [Without Git integration](without-git-integration)), there is no automatic history to roll back to — consider [adding Git to your vault](git-setup) so this safety net is available.
