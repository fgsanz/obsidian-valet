---
title: Kindle highlights split
slug: kindle-highlights-split
status: planned   # planned | in-progress | shipped
---

# Kindle highlights split

## Summary

- It convert a single note made by the Obsidian plugin “Kindle highlights” into multiple notes
- Create a new functionality that will be accessed in the GUI via the page "Body note"
- The name of the functionality is "Kindle highlights split"


## Motivation

- It enables better smarter note taking
- The plugin [Kindle Highlights](https://community.obsidian.md/plugins/obsidian-kindle-plugin) takes the highlights of a Kindle ebook and creates a single note in Obsidian
- A single note containing all snippets of a whole book is against good practices smart note taking. A healthy smart note taking approach requires atomic, independent and self-contained notes (something close to one aphorism per note)
- Atomic notes unleash the potential to connect the same content with very different topcis. Also, if you are using RAG embeddings your notes will much more meaningful compared to a huge single note

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Extra details and definitions

### How to identify a note of the kind "Kindle highlights"

A "Kindle highlights" note is a note that has one or some of the following properties in the YAML metadata:

```
kindle-bookId:
kindle-title:
kindle-author:
kindle-highlightsCount:
kindle-asin:
kindle-lastAnnotatedDate:
kindle-bookImageUrl:
```

### Anatomy of a "Kindle highlights" note is as follows:

Typical content of a "Kindle highlights" note:

- Metadata section (at the top), typically with properties, but it may contain other proeprties as well...
    - kindle-bookId
    - kindle-title
    - kindle-author
    - kindle-highlightsCount
    - kindle-asin
    - kindle-lastAnnotatedDate
    - kindle-bookImageUrl
- H1 section: Name of the note
- H2 section: Metadata info, typically with the values...
    - Author
    - ASIN
    - Reference
    - Kindle link
- H2 section: Highlights, all the highlights, at least one or many
    - Inside the highlights section, each highlight is separated from other highlights by a `---` row

### How to split a note of the kind "Kindle highlights"

Each split note must contain the following:

- Metadata section (at the top)
    - All the properties from the original note (whatever they are)
    - Plus the properties the user have defined, with the respective values
    - Plus the following properties, if not set
- H1 section: Call it "Metadata"
    - Name: Name of the note
    - Author
    - ASIN
    - Reference
    - Kindle link
- H1 section: Call it "Highlight" + {counter} , e.g. `Highlight 037` for the 37th highlight (starting with 1) out fo 187 highlights
    - The text of the highlight (only one highlight per note)

### Splitting example

Assume that the note below is the chosen note by the user and it is called "Agile Estimating and Planning - Kindle highlights.md"; it contains 2 highlights:

```
---
kindle-bookId: "49452"
kindle-title: Agile Estimating and Planning
kindle-author: Mike Cohn
kindle-highlightsCount: 2
kindle-asin: B004X1D3TC
kindle-lastAnnotatedDate: 2026-07-05
kindle-bookImageUrl: https://m.media-amazon.com/images/I/61SeXSb+xZL._SX1024.jpg
people:
  - "[[Mike Cohn]]"
---
# Agile estimating and planning
## Metadata
* Author: [Mike Cohn](https://www.amazon.comundefined)
* ASIN: B004X1D3TC
* Reference: https://www.amazon.com/dp/B004X1D3TC
* [Kindle link](kindle://book?action=open&asin=B004X1D3TC)

## Highlights
As we discover these things, they affect our plans. This means we need plans that are easily changed. This is why the planning becomes more important than the plan. The knowledge and insight we gain from planning persists long after one plan is torn up and a revised one put in its place. So an agile plan is one that is easy to change. — location: [651](kindle://book?action=open&asin=B004X1D3TC&location=651) ^ref-30350

---
Estimating and planning are critical, yet are difficult and error prone. We cannot excuse ourselves from these activities just because they are hard. Estimates given early in a project are far less accurate than those given later. This progressive refinement is shown in the cone of uncertainty. The purpose of planning is to find an optimal answer to the overall product development question of what to build. The answer incorporates features, resources, and schedule. Answering this question is supported by a planning process that reduces risk, reduces uncertainty, supports reliable decision making, establishes trust, and conveys information. A good plan is one that is sufficiently reliable that it can be used as the basis for making decisions about the product and the project. Agile planning is focused more on the planning than on the creation of a plan, encourages change, results in plans that are easily changed, and is spread throughout the project. — location: [665](kindle://book?action=open&asin=B004X1D3TC&location=665) ^ref-50440

---
```

Assume the user did not change the default suggestions and kept "split note name prefix" (Agile Estimating and Planning - Kindle highlights) and "counter start number" (1). Then the the split feature creates the following 2 notes...

Note 1 called "Agile Estimating and Planning - Kindle highlights — 1"

```
---
kindle-bookId: "49452"
kindle-title: Agile Estimating and Planning
kindle-author: Mike Cohn
kindle-highlightsCount: 2
kindle-asin: B004X1D3TC
kindle-lastAnnotatedDate: 2026-07-05
kindle-bookImageUrl: https://m.media-amazon.com/images/I/61SeXSb+xZL._SX1024.jpg
people:
  - "[[Mike Cohn]]"
---
# Agile estimating and planning
## Metadata
* Author: [Mike Cohn](https://www.amazon.comundefined)
* ASIN: B004X1D3TC
* Reference: https://www.amazon.com/dp/B004X1D3TC
* [Kindle link](kindle://book?action=open&asin=B004X1D3TC)

## Highlight 1

As we discover these things, they affect our plans. This means we need plans that are easily changed. This is why the planning becomes more important than the plan. The knowledge and insight we gain from planning persists long after one plan is torn up and a revised one put in its place. So an agile plan is one that is easy to change. — location: [651](kindle://book?action=open&asin=B004X1D3TC&location=651) ^ref-30350
```

and note 1 called "Agile Estimating and Planning - Kindle highlights — 2"

```
---
kindle-bookId: "49452"
kindle-title: Agile Estimating and Planning
kindle-author: Mike Cohn
kindle-highlightsCount: 2
kindle-asin: B004X1D3TC
kindle-lastAnnotatedDate: 2026-07-05
kindle-bookImageUrl: https://m.media-amazon.com/images/I/61SeXSb+xZL._SX1024.jpg
people:
  - "[[Mike Cohn]]"
---

# Metadata
- Name: {name of the original note}
- Author: [Mike Cohn](https://www.amazon.comundefined)
- ASIN: B004X1D3TC
- Reference: https://www.amazon.com/dp/B004X1D3TC
- [Kindle link](kindle://book?action=open&asin=B004X1D3TC)

## Highlight 2

Estimating and planning are critical, yet are difficult and error prone. We cannot excuse ourselves from these activities just because they are hard. Estimates given early in a project are far less accurate than those given later. This progressive refinement is shown in the cone of uncertainty. The purpose of planning is to find an optimal answer to the overall product development question of what to build. The answer incorporates features, resources, and schedule. Answering this question is supported by a planning process that reduces risk, reduces uncertainty, supports reliable decision making, establishes trust, and conveys information. A good plan is one that is sufficiently reliable that it can be used as the basis for making decisions about the product and the project. Agile planning is focused more on the planning than on the creation of a plan, encourages change, results in plans that are easily changed, and is spread throughout the project. — location: [665](kindle://book?action=open&asin=B004X1D3TC&location=665) ^ref-50440
```

## Feature flow

### Step 1

- The user selects a "Kindle highlights" note (the original note) from the active vault
	- As the user types the name, an auto-complete aid shows them the note names matching the substring the user has typed
	- The user can select the note by either
        - keyboard up/down/enter
        - mouse click
        - typing the full note name
	- the user can clean the input field by clicking on the "X" icon at the right of the input field, like in other parts of the app

### Step 2

- The user must define (mandatory) a note name pattern prefix for the new notes
	- Field name: “Name prefix for split notes”
		- By default, have pre-set the prefix as the name of the original note
		- The user can edit field
		- the user can clean the input field by clicking on the "X" icon at the right of the input field, like in other parts of the app
	- Show a small text explaining that the prefix will be followed by an increasing count (e.g., Split note – 001)
	- Optionally, allow the user to enter a starting integer value. The default is 1
	- When splitting in the backend, the count will contain the same amount of digits than `kindle-highlightsCount`, and will use leading 0 when needed; example: if `kindle-highlightsCountis` then the first split note is ` – 001` and last is `- 187`
	- Somewhere in the GUI, give the example of how the first and last split notes will be named

### Step 3

- The user must define (mandatory) a target path for the split notes
	- The field is auto-complete like in other parts in the app where a directory is define, like this:
	  ![img1](Pasted image 20260705172354.png)
	- only allow existing directories
	- the user can clean the input field by clicking on the "X" icon at the right of the input field, like in other parts of the app
	- by default, have the path pre-filled to the same path of the original note

### Step 4

- The user can define YAML properties (and their respecting values), that will be used in the YAML metadata of the split notes.
	- by default there are no properties, the user adds the pair "name and value" one at a time
	- when the user adds a pair, use a similar visual design than the bulk operation "add value", like this:
	  ![img2](Pasted image 20260705171704.png)
	  with auto complete for the name of the property like this:
	  ![img3](Pasted image 20260705171729.png)
	  and same functionality to clear the value like this:
	  ![img4](Pasted image 20260705171811.png)
	- Only allow adding properties which are already defined in the vault
	- When setting values, leverage the value suggestions and value format validation based on property type, as currently in the app

### Step 5

- This step is optional
- Give the option to either delete the original file or keep it. By default, keep the original file

### Step 6

- This step is optional
- In the GUI, only enable the action to preview or launch the split functionality when the name prefix and target path are set
- Provide a "preview" functionality
	- it will show the content of the first split note
	- The user can click next" and "previous" and see all split notes

### Step 7

- In the GUI, only enable the action to preview or launch the split functionality when the name prefix and target path are set
- If the vault has Git
	- provide the functionality to have a git commit "before" and "after"
	- provide the possibility to revert, similar to the functionality in "bulk operations" in "metadata" page
- While the splitting takes place, provide a visual cue that it is happening, maybe a counter, maybe an activity indicator
- When the splitting is done, provide a visual cue that it is done

## Acceptance criteria

### Test files

- Test files:
    -  ../tests/fixtures/test-vault/Books/Agile estimating and planning - Mike Cohn.md
    -  ../tests/fixtures/test-vault/Books – Kindle highlights/Agile Estimating and Planning - Kindle highlights.md

### BDD
- Given the file `Agile estimating and planning - Mike Cohn.md`, when the user picks that file as the Kindle highlights note, then the tool determined that this is not a Kindle highlights note and it lets the user know and it blocks the user from moving further with the flow
- Given the file `Agile Estimating and Planning - Kindle highlights.md`, when the user picks that file as the Kindle highlights note, then the tool determined that this is a Kindle highlights note and allows the user from moving further with the flow
- Given the file `Agile Estimating and Planning - Kindle highlights.md`, when the user launches preview, then the tool splits the original note into 187 notes

### Other

- Make sure enough unit test, interaction and GUI test covers the functionality

## GUI and mockups

- In the page "Body note" add two tags in the same way than in page "Metadata" and call them "Kindle highlights split" (the new functionality comes here) and "Audible splits" (leave them empty for now)
- Within the tab "Kindle highlights split", at the top, add a small text explaining the motivation behind the feature and give a link to the doc "Kindle highlights split"
- And below that text, develop the GUI
- Before implementing the GUI, show me in Claude Design the workflow and the wireframe, do not implement the GUI without an express agreement with me

## Documentation

Create a new documentation as follows:
- Doc section: Usage
- Doc name: Kindle highlights split
- Doc slug: kindle-highlights-split
- Doc positioning within the section: above the doc "Upgrading the tool"

## Notes / open questions

- Maybe for this feature it would be useful to use templates already defined in the vault, so that instead of adding one by one the YAML properties, they can be picked all at once by selecting a template. But currently there is no functionality to read templates from the vault, no design approach to store them nativaly in MacOS, Windows and Linux, no design to refresh them, etc. Maybe this can be done in a later stage

