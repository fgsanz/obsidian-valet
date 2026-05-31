---
tags:
  - "#tag1"
  - "#tag2/subtag"
icon: LiBox
aliases:
  - some alias name 1
  - some alias name 2
date: 2026-05-31
week: "[[2026-W22]]"
time: 20:56
cssclasses:
number headings:
parent:
  - "[[Obsidian]]"
  - "[[Scripting]]"
related:
  - "[[AI]]"
  - "[[5G Core|5GC]]"
  - "[[3D printing]]"
---


Name of the tool, for now, it is "Obsidian valet", but we might change it later. Be ready for it, so that we change it in one place and then this cascades to the documentation and everywhere.

# Goal of the tool

The goal is to build a tool that manipulates notes within a given Obsidian vault.

- Works with an Obsidian vault at file system level
- Leverage the local Git repo of the Obsidian vault to commit changes before applying single or bulk operations, for recovery and rollback purposes, and asks to persists changes by committing again after the vault owner confirms that changes are correctly applied
- The vault can be changed in the tool
- There could be the case that some vaults are test vaults and are not then initialized with a Git repo

# About the companion tool

- The tool itself will be in a Git repo, which will be synced to GitHub
- The tool sits outside the Obsidian vault
- The interface of the tool is served locally as a website, desktop friendly
- The tool is running only when launched from CLI
- When launched via CLI, the tool looks for an available port and provides in the console a URL that can be clicked (or copied) for convenience
- The execution and the processing of the tool will take place as much as possible locally, no use of AI tokens


# Functionality

- Ability to define vaults and remember them. On each vault, remember a forbidden directories, and a list of properties names and property types. In the future, anything that has to be defined at vault level goes in this section
- The notes can be in different directories, but mind the forbidden directories
- Find a way to provide the following bulk operations. Suggest menu commands with good UX flows, confirmations before applying the modifications, request a confirmation form the user that things went well and push a new commit
- List all the notes where one or more properties match the value criteria (the format of the value depends on the name of the property and value, see the section for Obsidian skills)
- List all the notes where one or more properties do not match the value criteria
- Use the list of matched notes to apply bulk operations that will change the value (or one of the values if the property is an array) of the property
- When possible, give me stats such as how many notes match the criteria, how many files were successfully changes and how many errors happened (and if so, in which notes)
- Before applying the bulk operation, if the vault has Git, the tool should ask the user for a Git comment, but the tool should already propose a sensible comment text and the user can simply accept it or change it

	Dummy but concrete examples of wanted operations:
	- List all the notes where either "parent" or "related" contain [[note1]]
	- List all the notes where "parent" does not contains [[note1]]
	- List all the notes where neither "parent" or "related" contain [[note1]]
	- In all the notes where "parent" contains [[note1]], move [[note 1]] link to "related"
	- In all the notes where "parent" contains [[note1]], delete [[note 1]]

- Create a section with documentation, served by the same tool, explaining how to do things. Assumed a skilled users, there is no need to explain every single click, assuming that the UX and visual design is intuitive. Keep an eye of changes in the tool and do not allow docs to go stale, update them when the functionality changes

# Tool skills needed

As much as possible, define this skills for future re-use of other tool projects.

## Obsidian skill

- Understanding of Obsidian. Info: https://obsidian.md/help/
- In particular, understanding of YAML metadata in Obsidian. Info: https://obsidian.md/help/properties
- Mind the type of property within the YAML metadata, e.g., arrays, single value, date, tag
- Awareness of allows and forbidden folders within the vault

Example of YAML metadata of my notes:

There could be other notes that have different properties in their metadata, but this is a good example for most notes. Things to note:

- note that some properties are arrays and some not
- "tags": the existence of tags and subtags
- "aliases": the aliases can have spaces
- "date": format YYYY-MM-DD, the tool should be able to filter by looking for an exact date or dates before or after a given date
- "week": format example [[2026-W22]], which means year 2026 and week 22, the "-W" is a separator between year and week number
- note that links to notes are defined by double square brackets [[like this]]
- note that links to notes can have aliases separated by a pipe `|` character like this: [[original name|alias name]]

```
---
tags:
  - "#tag1"
  - "#tag2/subtag"
icon: LiBox
aliases:
  - some alias name 1
  - some alias name 2
date: 2026-05-31
week: "[[2026-W22]]"
time: 20:56
cssclasses:
number headings: auto, first-level 1, max 3, contents ^toc, 1.1
parent:
  - "[[Obsidian]]"
  - "[[Scripting]]"
related:
  - "[[AI]]"
  - "[[5G Core|5GC]]"
  - "[[3D printing]]"
---
```

## Git and GitHub skill

- Understanding of Git operations
- Understanding of GitHub operations

# Improvements

- [x] when selecting a vault, add the ability to either enter the absolute path or browse the folder; in the suggested path, use `~/Obsidian/MyVault`; put the path to the left and the name on the right; the vault name is readonly, and it is the last folder of the path; so in the default vaule name is calculated to `MyVault`
- [x] Forbidden directories. Autocomplete the name of directories inside the vault, and only when one directory is selected enable the ADD button. By default text in the input field show `Type the name of a folder`
- [x] Do not ask to add properties to the vault. Once the vault is defined, self discover the properties inside the vault and figure out by yourself the type. Show them in a table with columns name and type
- [x] in the menu bar, clicking in `Obsidian Valet` takes you to the home page
- [x] make the top bar fixed at the top, should always be visible
- [x] If there is only one vault defined, make it active by default
- [x] when selecting forbidden directories of a vault, do not allow entering directories that does not exist
- [x] when selecting forbidden directories of a vault, improve the dropdown; as I am typing, only show the directories matching the substring being typed, and allow the use of the keyboard to navigate up and down the directories matched and shown; allow [Enter] to select; allow Enter to add; when added, clean the input field
- [x] in the operations page, put `filter notes` and `bulk operations` in tabs
- [x] bug: in the documentation page, clicking on the links to the docs takes the user to the home page, not the doc
- [x] add ability to refresh the list of properties and types of the vault
