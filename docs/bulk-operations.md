---
title: Metadata operations
slug: metadata-operations
description: Filter notes by property values and apply bulk changes
---

# Metadata operations

| Operation | Description | Example|
| --------- | ----------- |--------|
| **Delete value** | Removes a specific value from a property | Remove `[[Note X]]` from `parent`|
| **Delete value** | removes a specific value from a property | Remove `[[Note X]]` from `parent`|
| **Replace value** | Replaces a specific value with another | Eeplace `[[Old note]]` with `[[New note]]` in `parent`|
| **Move value** | Removes a value from one property and adds it to another | Move `[[Note X]]` from `parent` to `related`|
| **Add value** | Adds a new value to a property | See details below |

Regarding **Add value** operation:
- For **multi-value properties** (text-array, tag-array, link-array): appends the value to the array (skips if it already exists)
- For **single-value properties** (text, number, date, week-link, link): only adds to notes where the property is currently empty; notes that already have a value are not affected

# Preview

Click **Preview** to see which notes would be affected without writing any files.

# Apply

If the vault has Git, a commit dialog appears to create a safety checkpoint before writing any files. See [Git integration](git-integration).

After the operation, the results panel shows:

- How many notes were changed successfully
- How many notes were not affected
- How many errors occurred (and on which files)

# Commit changes (optional)

If the vault has Git, a **Commit changes to git** button appears after a successful operation. Use it to commit the post-operation state. Click **New operation** to start over.

# Examples

List all notes where `parent` or `related` contain `[[ProjectX]]`:
- Rule 1: `parent` `exists and contains` `[[ProjectX]]`
- Rule 2 (OR): `related` `exists and contains` `[[ProjectX]]`

---

In all notes where `parent` contains `[[ProjectX]]`, move it to `related`:
- Filter: `parent` `exists and contains` `[[ProjectX]]`
- Operation: Move value · From `parent` · To `related` · Value `[[ProjectX]]`

---

Delete `[[OldNote]]` from `parent` in all matching notes:
- Filter: `parent` `exists and contains` `[[OldNote]]`
- Operation: Delete value · Property `parent` · Value `[[OldNote]]`

---

Add `[[NewNote]]` to the `related` property in all matching notes:
- Filter: Any filter criteria (e.g., all notes in a directory)
- Operation: Add value · Property `related` · Value `[[NewNote]]`
- Result: If `related` already contains `[[NewNote]]`, it won't be added again

---

Add a tag to all matching notes:
- Filter: Any filter criteria (e.g., notes without a `status` tag)
- Operation: Add value · Property `tags` · Value `review`
- Result: The tag is appended to the `tags` array in each matching note

---

Set a date on all notes in a directory (that don't have one):
- Filter: `date` `does not exist` in a specific directory
- Operation: Add value · Property `date` · Value `2026-06-03`
- Result: Only notes without a date are affected; notes that already have a `date` value are skipped
