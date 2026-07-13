---
title: What's next
slug: whats-next
description: Planned and proposed functionality for upcoming releases
---

# What's next

A look at functionality that is planned or under consideration for future releases. Nothing here is
a commitment or a schedule — it's a sense of direction.

## General

- I am considering converting this tool as an Obsidian plugin. But first I will focus on developing the functionality that motivated me to build this tool.

## Metadata

- Move inline properties made for the Obsidian plugin [Dataview](https://obsidianhub.org/plugins/dataview#overview) to `frontmatter` (YAML)
- Empty all values of a given property
- Delete a property (or several) from the notes matching the filter
- Clicking on a note's filename opens it in Obsidian directly
- New operator for properties of the type `link-array`, `text-array` and `tag-array`: Match when the count of values is none or any integer
- Add the ability to filter by filename (contains, does not contains). Currently the filtering is by directory and metadata
- Export filter table
- Export results table

## Content

- Split a single "Kindle highlights" into multiple notes. Motivation: A note containing all snippets of a whole book is against good practices smart note taking; we want atomic, independent and self-contained notes; atomic notes will unleash the connectivity of a single snippet, and if you are using RAG embeddings your notes will much more meaningful. So... Convert a single note made by the Obsidian plugin [Kindle highlights](https://community.obsidian.md/plugins/obsidian-kindle-plugin) into multiple notes. Allow defining properties and setting up values. Allow defining filename pattern for the new notes. Option to keep the original note. Maybe for this feature it would be useful to use templates already defined in the vault — to apply a template when splitting notes. Only allow adding properties which are already defined in the vault, to leverage format validation when dealing with property values.
- Split a single note with clip notes from "Audible" (audio book platform) into multi notes. Motivation: same reasoning than the splitting of "Kindle highlights" notes. Take default format from the Audible website (instruct users how to do it). Same capabilities than the splitting of "Kindle highlights".

## Analysis

- Show paths between two notes. Path length is determined by the amount of notes in between (hops). Show the shortest path, then the 2nd shortest, the 3rd shortest and so on. Show one or more paths together in a graph, chain or list. Allow copying note names and the whole list of notes with path relative to the vault's root. Allow exporting the note names and paths.
- List all values used in a given property. Allow to sort. Allow to copy and export.
- List common values between two properties. This is very handy to spot mixed approaches of linking and tagging notes — since you probably changed your mind over time. Add option to to ignore the aliases in the note's name such as `[[Albert Einstein|Einstein]]`. Allow copy and export.

---

Have an idea? The best way to suggest new functionality is via **GitHub Issues**. [Open an issue](https://github.com/fgsanz/obsidian-valet/issues) to share your suggestion.
