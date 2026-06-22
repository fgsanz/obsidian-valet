# Changelog

All notable changes to Obsidian Valet are documented in this file.

## [0.2.2] - 2026-06-22

### Improvements

- **Active-vault toggle**: the vault card's "Active" badge and "Make active" button are now a single
  toggle switch — flip a vault on to make it active.
- **Better contrast** for elements in the vault card, including the property-type labels (darker in
  light mode, lighter in dark mode) for easier reading.
- **Enhanced README.md** in GitHub with new images and sections, so that potential users understand what the tool is about. 

### No longer broken

- The forbidden-directory dropdown now reappears when you click the input again after picking a
  directory.
- Hovering the remove (✕) icon on a forbidden directory now tints the whole chip red, matching the
  delete cue used elsewhere in the app.

[0.2.2]: https://github.com/fgsanz/obsidian-valet/releases/tag/v0.2.2

---

## [0.2.1] - 2026-06-21

### Improvements

- **New version check runs periodically**, as opposed to checking for a new version only at tool launch.
- New doc **Upgrading the tool** explaining the two ways to update (git pull vs. downloading a
  release), with a pros/cons comparison.
- Documentation refinements, including a "Get the latest release" link on the Changelog page and a
  renamed **Bulk operations** doc.

[0.2.1]: https://github.com/fgsanz/obsidian-valet/releases/tag/v0.2.1

---

## [0.2.0] - 2026-06-21

### New

- **Multi-property bulk operations**: apply an operation across several properties at once.
- **Active vault**: set an active vault, with card visual cues and transitions; usability and
  design improvements across vault cards and vault settings.
- **Release notifications**: a bell with in-app notifications, including an optional setting that
  checks for new releases.
- **Resizable table columns** on the Filter and Results tables, without changing overall width.
- **Docs overhaul**: a docs home page with grouped, collapsible navigation sections, plus new
  documents — Getting started, Obsidian scenarios, Git and cloud-storage folders, Configuration,
  and Support. Images now support click-to-zoom.
- **"Metadata" tab**: the Operations page is now reached via the Metadata menu item (the
  bulk-operation concept is unchanged). 
- **Cross-platform configuration storage**: your `config.json` now lives in the OS-standard
  per-user config directory on Linux, macOS, and Windows, outside the repo — so updating the tool
  never touches your settings. All browser-stored settings were consolidated there too.

### Improvements

- **Git. Rollback robustness**: more reliable snapshot/commit/revert flows; a snapshot commit is
  forced even when there's nothing new to commit, and the revert flow now warns if no snapshot was
  taken beforehand.
- **Git. Cleaner handling of vaults without Git**: clearer handling and guidance when a vault isn't version-controlled.
- **Git. Robust vault Git detection** when adding or removing a vault after it's been defined.
- **Smoother navigation**: switching between tabs (Filter ↔ Metadata) and navigating to Vaults and
  back no longer drops filter criteria, in-progress operations, or the results table; clicking
  "Find notes" intentionally resets the bulk-operations tab.
- **Move operation**: the property chosen in `To` is no longer offered in the `From` dropdown.
- **Add/delete/move applicability**: clearer warnings when an operation wouldn't change anything,
  with a preview counter on the bulk-operation tab.
- **Clearable input fields**: an "X" button to quickly clear value fields.
- **Accessibility**: improved contrast between placeholder/suggested text and user-entered values.
- **Redesigned homepage**: cleaner, with handwritten step hints, plus new logo and favicon.

### No longer broken

- Operation **add-value** on **single-value properties** was wrongly blocked when any of the matched notes already had
  a value; it now proceeds, since the backend only fills notes whose value is empty.
- Filter table sometimes showed the `title` property instead of the filename.
- The copy icon in the filter table is now always visible regardless of filename length.
- The count badge on the operations tab was rendered white-on-white on light theme. Now is dark.
- Switching from the Operations page to Vaults and back no longer clears the page.

### Developers

- **Interaction (component) tests**: React components are now tested with Testing Library in jsdom,
  running alongside the unit suite (`npm run test:unit`).
- **Test coverage**: Expanded test coverage for the replace/move operations, additional filter cases, and unit tests.
- Added **Dependabot** config for weekly dependency-update PRs.
- Cleared a TypeScript 7.0 deprecation warning.
- README sync script so shared sections are fed from the docs.
- `npm start` now builds before launching.

[0.2.0]: https://github.com/fgsanz/obsidian-valet/releases/tag/v0.2.0

---

## [0.1.0] - 2026-06-13
First public release.

### New

- **Filtering** notes by location (directory, applied recursively to subdirectories) and by
  frontmatter property values, with type-aware operators for text, text-array, tag-array, link,
  link-array, date, week-link, number, and boolean. Operators include `exists and contains`,
  `exists and does not contain`, `exists and is empty`, `exists and is not empty`, `exists`, and
  `does not exist`. Link queries also match the full note-name + alias combination.
- **Bulk operations**: delete a value, replace a value, move a value between properties, and add a
  value — all type-aware and careful not to corrupt YAML frontmatter. Preview the exact changes
  before applying.
- **Git integration**: a safety snapshot before each operation, plus an optional commit or
  one-click revert afterwards. Works entirely with a local repository — no GitHub/GitLab account
  or remote is required.
- **Preview** simulates and shows you the changes before they are applied.
- **Results view** shows you exactly what has been changed and whether there were issues.
- **In-app documentation** served at `/docs`, including a list of test cases generated from the
  test suite.
- **Settings** panel with a light / dark / follow-system color scheme.

### Developers

- **BDD test suite** (Cucumber) that runs the real services against a throwaway copy of a
  committed test vault.
- **Dev docs** detailing how is the test vault built, how to run test cases, and how to create new test cases

[0.1.0]: https://github.com/fgsanz/obsidian-valet/releases/tag/v0.1.0

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

