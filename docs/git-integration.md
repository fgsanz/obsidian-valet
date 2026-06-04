---
title: Git integration
slug: git-integration
description: Safety checkpoints before and after operations
---

# Git integration

If an Obsidian vault contains a git repository, Obsidian Valet integrates with it to provide safety checkpoints around bulk operations.

## Pre-operation commit

Before applying any bulk operation, Obsidian Valet checks whether the vault has a git repo. If it does, a commit dialog appears with a pre-filled message such as:

```
chore: snapshot before delete "[[OldNote]]" from parent [Obsidian Valet]
```

You can edit the message or accept it as-is. Clicking **Commit** stages all current changes (`git add -A`) and commits them. This gives you a rollback point.

If you click **Skip git commit**, the operation proceeds without a checkpoint. Use this when you know the vault state is already clean.

## Post-operation commit

After a successful operation, a **Commit changes to git** button appears. Use it to commit the result state with a message such as:

```
chore: apply operation — 12 notes changed
```

This is separate from the pre-operation commit so you have a clean "before" and "after" in your history.

## No git repo

If the vault is not a git repository, both commit steps are silently skipped. No error is shown. The operation proceeds directly.

## Rollback

To undo an operation, use standard git commands in the vault directory:

```sh
git log --oneline          # find the commit before the operation
git revert HEAD            # revert the last commit
# or
git reset --hard <sha>     # hard reset to a specific state
```

Obsidian Valet does not provide a rollback UI — use your git client of choice.
