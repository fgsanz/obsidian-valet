---
title: With Git integration
slug: git-integration
description: Safety snapshots, commits, and one-click revert around bulk operations
---

# With Git integration

If the Obsidian vault is a Git repository:
- Obsidian Valet integrates with Git to give you a safety net around every bulk operation
- A **snapshot before**, and an optional **commit or revert after**
- See [Add Git to your vault](git-setup) for how to add Git to a vault (it works fully offline — no GitHub or GitLab needed)

If the vault is not a git repository:
- All of Git steps are skipped automatically – see [Without Git integration](without-git-integration) for what happens then
- To undo an operation by hand, see [Operation rollback](operation-rollback)

---

## Before the operation: Git snapshot

When you click **Apply changes** on a vault that has Git, a popup appears before the operation is applied, containing a pre-filled comprehensive commmit message.

Example:
```
[Obsidian Valet] Before: delete, property: parent, value: [[Note X]]
```

You can edit the message or accept it.

---

## After the operation: Commit or revert

Once the operation has been applied, an **Optional →** action shows next to the operation buttons. The results outcome dictates the suggested action:

### If no errors → Commit changes

If every targeted note changed cleanly, an **Optional → Commit changes** button appears. Clicking it opens a popup dialog with an editable commit message describing the result:

```
[Obsidian Valet] After: delete, property: parent, value: [[Note X]]
```

This way, you get a clean *before* and *after* in your history.

### If errors → Revert changes

If the operation reported any errors, an **Optional → Revert changes** button appears instead. Clicking it opens a **Revert changes** dialog (no message to write) with a single action that restores the vault to the state captured by the pre-operation snapshot.

Under the hood this runs `git reset --hard HEAD`, discarding the operation's uncommitted edits and returning your tracked files to the last commit.

> **Note:** The revert restores tracked files to the most recent commit. It works as a true "undo the operation" when you took the snapshot first; if you skipped the snapshot, it reverts to whatever the previous commit was.

For more information on rollback, see [Operation rollback](operation-rollback).