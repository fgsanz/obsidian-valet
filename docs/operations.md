---
title: Operations
slug: operations
---

# Operations

The **Operations** page is a multi-step workflow: filter notes → review matches → choose an operation → apply.

## Step 1 — Filter

Filters consist of two sections: **Location** and **Properties**. Both sections must have at least one rule.

### Location section

Controls where to search:

- **All allowed directories** — search all non-forbidden directories (default)
- **Directory is** — search only notes in a specific directory or its subdirectories
- **Directory is not** — exclude a specific directory and its subdirectories

Select a directory from the dropdown if using "directory is" or "directory is not".

### Properties section

Filter notes by frontmatter values:

- **Property** — the frontmatter key to test (e.g. `parent`, `tags`, `date`)
- **Operator** — choose from:
  - `exists and contains` — property is defined AND value includes the query
  - `exists and does not contain` — property is defined AND value does not include the query
  - `exists and is empty` — property is defined but null or blank
  - `does not exist` — property not defined in frontmatter
- **Value** — the value to match (required for `exists and contains` and `exists and does not contain`; omitted for other operators)
- **Case sensitivity** — click the **Aa** button to toggle case-sensitive matching (default is case-insensitive)

For link properties, provide the link in `[[Note Name]]` syntax. The tool validates this format.

### Combining rules

Multiple location rules and multiple property rules are combined with **AND** (all rules must match) or **OR** (any rule must match) within each section. The location rules are applied first, then the property rules are applied to the matched notes.

Click **Find notes** to run the filter. The matched notes appear below.

## Step 2 — Review

The matched note list shows each note's title, path, and the values of the properties used in the filter rules.

The count in the stats bar shows how many notes matched. If the count is higher or lower than expected, adjust the filter rules and run again.

## Step 3 — Choose operation

Four bulk operations are available:

- **Delete value** — removes a specific value from a property (e.g. remove `[[OldNote]]` from `parent`)
- **Replace value** — replaces a specific value with another (e.g. replace `[[OldNote]]` with `[[NewNote]]` in `parent`)
- **Move value** — removes a value from one property and adds it to another (e.g. move `[[OldNote]]` from `parent` to `related`)
- **Add value** — adds a new value to a property:
  - For **multi-value properties** (text-array, tag-array, link-array): appends the value to the array (skips if it already exists)
  - For **single-value properties** (text, number, date, week-link, link): only adds to notes where the property is currently empty; notes that already have a value are not affected

Click **Preview** to see which notes would be affected without writing any files.

## Step 4 — Apply

Click **Apply changes**. If the vault has git, a commit dialog appears to create a safety checkpoint before writing any files. See [Git integration](git-integration).

After the operation, the results panel shows:

- How many notes were changed successfully
- How many errors occurred (and on which files)

## Step 5 — Commit changes (optional)

If the vault has git, a **Commit changes to git** button appears after a successful operation. Use it to commit the post-operation state. Click **New operation** to start over.

## Examples

**List all notes where `parent` or `related` contain `[[ProjectX]]`:**
- Rule 1: `parent` `exists and contains` `[[ProjectX]]`
- Rule 2 (OR): `related` `exists and contains` `[[ProjectX]]`

**In all notes where `parent` contains `[[ProjectX]]`, move it to `related`:**
- Filter: `parent` `exists and contains` `[[ProjectX]]`
- Operation: Move value · From `parent` · To `related` · Value `[[ProjectX]]`

**Delete `[[OldNote]]` from `parent` in all matching notes:**
- Filter: `parent` `exists and contains` `[[OldNote]]`
- Operation: Delete value · Property `parent` · Value `[[OldNote]]`

**Add `[[NewNote]]` to the `related` property in all matching notes:**
- Filter: Any filter criteria (e.g., all notes in a directory)
- Operation: Add value · Property `related` · Value `[[NewNote]]`
- Result: If `related` already contains `[[NewNote]]`, it won't be added again

**Add a tag to all matching notes:**
- Filter: Any filter criteria (e.g., notes without a `status` tag)
- Operation: Add value · Property `tags` · Value `review`
- Result: The tag is appended to the `tags` array in each matching note

**Set a date on all notes in a directory (that don't have one):**
- Filter: `date` `does not exist` in a specific directory
- Operation: Add value · Property `date` · Value `2026-06-03`
- Result: Only notes without a date are affected; notes that already have a `date` value are skipped
