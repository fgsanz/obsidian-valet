# Changelog

All notable changes to **Obsidian Valet** are documented in this file.

## [0.1.0] - 2026-06-13

First public release.

### Added

- **Filtering** notes by location (directory, applied recursively to subdirectories) and by
  frontmatter property values, with type-aware operators for text, text-array, tag-array, link,
  link-array, date, week-link, number, and boolean. Operators include `exists and contains`,
  `exists and does not contain`, `exists and is empty`, `exists and is not empty`, `exists`, and
  `does not exist`. Link queries match the full note-name + alias combination.
- **Bulk operations**: delete a value, replace a value, move a value between properties, and add a
  value — all type-aware and careful not to corrupt YAML frontmatter. Preview the exact changes
  before applying.
- **Git integration**: a safety snapshot before each operation, plus an optional commit or
  one-click revert afterwards. Works entirely with a local repository — no GitHub/GitLab account
  or remote is required.
- **Results view** with per-note changed / unchanged / error status and live counters.
- **In-app documentation** served at `/docs`, including a list of test cases generated from the
  test suite.
- **Settings** panel with a light / dark / follow-system color scheme.
- **BDD test suite** (Cucumber) that runs the real services against a throwaway copy of a
  committed test vault.

[0.1.0]: https://github.com/fgsanz/obsidian-valet/releases/tag/v0.1.0

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
