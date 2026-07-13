---
title: Kindle highlights split
slug: kindle-highlights-split
description: Split one "Kindle highlights" note into many atomic, one-highlight-per-note notes
---

# Kindle highlights split

The [Kindle Highlights](https://community.obsidian.md/plugins/obsidian-kindle-plugin) community
plugin imports every highlight of a whole book into a **single** note. That works against good
smart-note-taking practice: notes are most useful when they are **atomic** — roughly one idea per
note — so they can be linked across topics and make far more meaningful RAG embeddings than one
giant note.

**Kindle highlights split** turns one such note into many notes, one highlight per note, from the
**Content** page.

# Detecting a Kindle highlights note

A note counts as a Kindle highlights note when its frontmatter has one or more `kindle-*`
properties (e.g. `kindle-bookId`, `kindle-title`, `kindle-highlightsCount`, `kindle-asin`). If the
note you pick has none, the tool tells you and blocks the flow.

# The flow

1. **Choose the note.** Type a note name; the picker autocompletes. When it is a Kindle highlights
   note, the tool confirms it and shows how many highlights it found.
2. **Name the split notes.** Set a name prefix (defaults to the original note's name). Each note
   becomes `<prefix> — NNN`, where `NNN` is an incrementing counter zero-padded to the width of
   `kindle-highlightsCount` (187 highlights → `001`…`187`). You can change the starting number; the
   first/last example names update as you type.
3. **Choose the target folder.** Existing folders only (autocomplete). Defaults to the original
   note's folder.
4. **Add properties (optional).** Add frontmatter properties to every split note. Only properties
   already defined in the vault are offered, and values are validated by property type — the same
   rules as [Bulk operations](bulk-operations). A `source` link back to the original note is added
   automatically, unless you add a property that already links back.
5. **Keep or delete the original.** The original note is kept by default.

# Each split note

Every split note preserves the **original frontmatter verbatim**, adds your properties (and the
`source` backlink), then a `# Metadata` block (Name, Author, ASIN, Reference, Kindle link) and a
single `# Highlight NNN` section with that highlight's text.

# Preview

Click **Preview** to page through every note the split would create — filename and full content —
without writing anything.

# Run & safety

Splitting is enabled once a valid note, a prefix and a target folder are set. If the vault has Git,
you are offered a **snapshot before**, a **commit after**, and the option to **revert**. Reverting
deletes the newly created notes and restores the snapshot — note that Git alone would leave the new
files behind, so the revert removes them explicitly. See [Git integration](git-integration) and
[Operation rollback](operation-rollback).

The split never overwrites: if a target note name already exists in the folder, the whole operation
is refused and nothing is written.
