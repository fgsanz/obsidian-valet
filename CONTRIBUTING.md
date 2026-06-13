# Contributing to Obsidian Valet

Thanks for your interest in improving Obsidian Valet! This is a **local-first, offline** tool for bulk-editing Obsidian vault notes via their YAML frontmatter. Contributions of all kinds are welcome: bug reports, feature ideas, documentation, and code.

By contributing you agree that your work is offered under the same license as the project.

---

## Guiding principles

Keep these in mind so changes stay aligned with the project's intent:

- **Offline and private.** The tool never sends vault content to any external service and spends no AI tokens. Don't add network calls to third-party services.
- **Safe by default.** Bulk edits are destructive, so safety features (git snapshots, preview, revert, type validation) matter. Preserve and extend them rather than bypassing them.
- **The vault is the source of truth.** Operations read and write real `.md` files; never corrupt YAML frontmatter, and respect each property's declared type.

---

## Prerequisites

- **Node.js 20+**
- **npm**

## Getting set up

```sh
git clone https://github.com/fgsanz/obsidian-valet.git
cd obsidian-valet
npm install
```

Run the app in development (Vite dev server on port 5173 + API server on 3741, with hot reload):

```sh
npm run dev
```

Or run the production-style server (builds and serves on port 3741):

```sh
npm start
```

Vault definitions live at `~/.config/obsidian-valet/config.json`; add vaults from the **Vaults** page in the app. For experimenting safely, point it at a throwaway vault (or use the test fixture under `tests/fixtures/test-vault/`).

---

## Project layout

```
src/
  shared/   # Types, Zod schemas, and constants shared by server + client
  server/   # Fastify API — config, routes, services (scanner, filter, operations, git)
  client/   # React frontend — pages, components, API client, styles
docs/        # Documentation served in-app at /docs
scripts/     # check-docs.ts — validates documentation coverage
tests/       # BDD test suite (Cucumber) + the committed test vault fixture
```

See the [README](README.md) for a quick tour and [`docs/`](docs/) for how individual features work.

---

## Before you open a pull request

Run all three checks and make sure they pass:

```sh
npm run typecheck     # tsc --noEmit — no type errors
npm test              # Cucumber BDD suite — all scenarios green
npm run check-docs    # documentation coverage
```

A change that touches behavior should generally come with a test and, where relevant, a docs update.

---

## Coding conventions

- **TypeScript everywhere.** Keep things typed; avoid `any`. Shared types and Zod schemas belong in `src/shared/` so the server and client agree.
- **Match the surrounding code.** Follow the existing naming, structure, and comment density of the file you're editing rather than introducing a new style.
- **Validate at the boundary.** Server routes parse input with the Zod schemas in `src/shared/schemas.ts`. Add to those when you add fields.
- **Property types are authoritative.** Filtering and operations resolve a property's type via the shared helpers (e.g. `resolvePropertyType`) and the backend — not the UI — enforces what values are valid. Don't move that logic into the client only.
- **Styling** uses CSS Modules (`*.module.css`) with the design tokens in `src/client/styles/variables.css`. Reuse the `--color-*`, `--space-*`, and `--text-*` variables instead of hardcoding values, so both color schemes keep working.
- **Atomic, focused commits** with clear messages. Keep unrelated changes in separate PRs.

---

## Writing tests

Tests are **behaviour-driven** (Gherkin / Cucumber) and run the real filter/operation services in-process against a throwaway copy of a committed test vault. They live under `tests/`:

```
tests/
  features/        # .feature files (scenarios) + step definitions
  fixtures/        # the committed test-vault (never mutated at runtime)
  support/         # world, hooks, and the vault schema
```

- Run the suite: `npm test`
- See each step with the values it observed: `npm run test:verbose`
- Inspect the modified files afterwards: `npm run test:keep` (preserves the temp vault copy and prints its path)

When you add or change behavior, add a scenario in the matching `.feature` file. The full step vocabulary, the test-vault contents, and how the throwaway-copy isolation works are documented in-app under **Docs → Testing** ([docs/testing.md](docs/testing.md)) and **Docs → Test vault** ([docs/test-vault.md](docs/test-vault.md)). The **Test cases** doc is generated automatically from the feature files.

---

## Writing documentation

User-facing docs live in [`docs/`](docs/) as Markdown files served inside the app. Each page needs frontmatter:

```markdown
---
title: Your page title
slug: your-page-slug
description: One line shown in the nav and on the docs landing page
---
```

A new doc with valid frontmatter appears automatically in the left nav and on the landing page (ordering for known pages is controlled in `src/server/routes/docs.ts`). Run `npm run check-docs` to confirm coverage.

---

## Reporting bugs and proposing features

Open a GitHub issue and include:

- **For bugs:** what you did, what you expected, what happened, and the filter/operation involved. A screenshot of the Operations page or the relevant note's frontmatter is very helpful.
- **For features:** the problem you're trying to solve, not just the proposed solution.

---

## Pull request checklist

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (and new behavior has a scenario)
- [ ] `npm run check-docs` passes (and docs updated if behavior changed)
- [ ] The change is focused and the PR description explains the *why*

Thank you for helping make Obsidian Valet better!
