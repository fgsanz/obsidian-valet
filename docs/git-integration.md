---
title: With Git integration
slug: git-integration
description: Safety snapshots, commits, and one-click revert around bulk operations
---

# With Git integration

If an Obsidian vault contains a git repository, Obsidian Valet integrates with it to give you a safety net around every bulk operation: a **snapshot before**, and an optional **commit or revert after**. See [Add Git to your vault](git-setup) for how to add Git to a vault (it works fully offline — no GitHub or GitLab needed).

All of the steps below are skipped automatically if the vault is not a git repository — see [Without Git integration](without-git-integration) for what happens then. To undo an operation by hand, see [Operation rollback](operation-rollback).

---

## Snapshot before the operation

When you click **Apply changes** on a vault that has git, a **Git snapshot before operation** dialog appears first. It pre-fills a commit message describing what you are about to do, for example:

```
[Obsidian Valet] Before: delete, property: parent, value: [[OldNote]]
```

The message format mirrors the operation:

| Operation | Message |
|---|---|
| add / delete | `[Obsidian Valet] Before: add, property: {property}, value: {value}` |
| replace | `[Obsidian Valet] Before: replace, property: {property}, current_value: {old}, new_value: {new}` |
| move | `[Obsidian Valet] Before: move, from_property: {from}, to_property: {to}, value: {value}` |

You can edit the message or accept it. The dialog has three choices:

- **Commit & apply changes** — stages everything (`git add -A`), commits it as your rollback point, then applies the operation.
- **Skip git commit** — applies the operation without taking a snapshot. Use this when the vault is already in a clean, known state.
- **Cancel** — closes the dialog and does nothing.

---

## After the operation: commit or revert

Once the operation has run, the results table appears and an **Optional →** action shows next to the operation buttons. Which one you get depends on the outcome:

### No errors → Commit changes

If every targeted note changed cleanly, an **Optional → Commit changes** button appears. Clicking it opens a **Commit changes** dialog with an editable message describing the result:

```
[Obsidian Valet] After: delete, property: parent, value: [[OldNote]]
```

(Same field layout as the snapshot message, but it reads **After** instead of **Before**.) Click **Commit changes to git** to record the post-operation state. This gives you a clean *before* (the snapshot) and *after* (this commit) in your history. Once committed, the panel shows **Changes committed to git.**

### Errors → Revert changes

If the operation reported any errors, an **Optional → Revert changes** button appears instead. Clicking it opens a **Revert changes** dialog (no message to write) with a single action, **Revert to safety git snapshot**, which restores the vault to the state captured by the pre-operation snapshot.

Under the hood this runs `git reset --hard HEAD`, discarding the operation's uncommitted edits and returning your tracked files to the last commit. When it finishes, a **Changes reverted** confirmation appears with a **Got it** button.

> The revert restores tracked files to the most recent commit. It works as a true "undo the operation" when you took the snapshot first; if you skipped the snapshot, it reverts to whatever the previous commit was.
