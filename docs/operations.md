---
title: Operations
slug: operations
---

# Operations

The **Operations** page is a multi-step workflow: filter notes → review matches → choose an operation → apply.

## Step 1 — Filter

Build one or more filter rules. Each rule has three parts:

- **Property** — the frontmatter key to test (e.g. `parent`, `tags`, `date`)
- **Operator** — the comparison to apply (e.g. `contains`, `is before`)
- **Value** — the value to compare against

Multiple rules are combined with **AND** (all rules must match) or **OR** (any rule must match).

Click **Find notes** to run the filter. The matched notes appear below.

## Step 2 — Review

The matched note list shows each note's title, path, and the values of the properties used in the filter rules.

The count in the stats bar shows how many notes matched. If the count is higher or lower than expected, adjust the filter rules and run again.

## Step 3 — Choose operation

Three bulk operations are available:

- **Delete value** — removes a specific value from a property (e.g. remove `[[OldNote]]` from `parent`)
- **Change value** — replaces a specific value with another (e.g. change `[[OldNote]]` to `[[NewNote]]` in `parent`)
- **Move value** — removes a value from one property and adds it to another (e.g. move `[[OldNote]]` from `parent` to `related`)

Click **Preview** to see which notes would be affected without writing any files.

## Step 4 — Apply

Click **Apply to matched notes**. If the vault has git, a commit dialog appears to create a safety checkpoint before writing any files. See [Git integration](git-integration).

After the operation, the results panel shows:

- How many notes were changed successfully
- How many errors occurred (and on which files)

## Step 5 — Commit changes (optional)

If the vault has git, a **Commit changes to git** button appears after a successful operation. Use it to commit the post-operation state. Click **New operation** to start over.

## Examples

**List all notes where `parent` or `related` contain `[[ProjectX]]`:**
- Rule 1: `parent` `contains link to` `[[ProjectX]]`
- Rule 2 (OR): `related` `contains link to` `[[ProjectX]]`

**In all notes where `parent` contains `[[ProjectX]]`, move it to `related`:**
- Filter: `parent` `contains link to` `[[ProjectX]]`
- Operation: Move value · From `parent` · To `related` · Value `[[ProjectX]]`

**Delete `[[OldNote]]` from `parent` in all matching notes:**
- Filter: `parent` `contains link to` `[[OldNote]]`
- Operation: Delete value · Property `parent` · Value `[[OldNote]]`
