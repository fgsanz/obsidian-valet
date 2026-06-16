---
title: Operation rollback
slug: operation-rollback
description: Undo an applied operation by hand using standard git commands
---

# Operation rollback

When the vault is a git repository, the easiest way to undo an operation is the built-in **Revert changes** action (see [With Git integration](git-integration)).

For anything the UI doesn't cover — or to roll back to an older state — you can always fall back to standard git commands in the vault directory. See steps below.

## Rollback via Git commands

List the latest commits in your vault:

```sh
git log --oneline
```

This is an example of the outcome...

```
87ad181 (HEAD -> main) [Obsidian Valet] Before: add, property: aliases, value: Some alias
abad098 [Obsidian Valet] After: delete, property: tags, value: book
ea41465 [Obsidian Valet] Before: delete, property: tags, value: book
...
...
```

Create a new commit that undoes the last commit, called HEAD:

```sh
git revert HEAD
```

Or you can hard-reset the vault (the working tree) to a specific snapshot. In the example above, to revert to `Before: delete, property: tags, value: book` issue the command below replacing `<sha>` with `ea41465`:

```sh
git reset --hard <sha>
```

If the vault is not a git repository (see [Without Git integration](without-git-integration)), there is no automatic history to roll back to — consider [adding Git to your vault](git-setup) so this safety net is available.
