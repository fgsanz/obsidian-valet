---
title: npm scripts
slug: npm-scripts
description: What each npm run command does
---

# npm scripts

All commands are run from the project root with `npm run <script>`.

## dev

```sh
npm run dev
```

For active development. Starts two processes side-by-side:

- **Vite** on port 5173 — serves the React frontend with hot reload. Changes to `.tsx` and `.css` files appear in the browser instantly, no refresh needed.
- **API server** on port 3741 — the Fastify backend, watched by `tsx` so it restarts automatically when server files change.

Both outputs appear in the same terminal, prefixed with `[vite]` and `[server]`. Once both are running, open `http://localhost:5173` in your browser.

## build

```sh
npm run build
```

Compiles and bundles the React frontend into `dist/client/` using Vite. Run this before `npm start` whenever you have made frontend changes. Not needed during development — `npm run dev` handles that automatically.

## start

```sh
npm start
```

Starts the production app. The server runs on port 3741 (or the next available port) and serves both the API and the compiled frontend from `dist/client/`. Opens the browser automatically. This is the command to run the tool day-to-day.

Requires a prior `npm run build` if frontend files have changed.

## preview

```sh
npm run preview
```

Shortcut for `npm run build && npm start`. Useful for verifying that the production build looks and works correctly before committing.

## typecheck

```sh
npm run typecheck
```

Runs the TypeScript compiler in check-only mode — no files are written. Catches type errors across all source files (both server and client) in one pass. Fast way to verify correctness without going through a full build.

## test

```sh
npm test
```

Runs the whole test suite: the **unit tests** first (Node's `node:test`), then the **BDD scenarios** (Cucumber). A single pass/fail signal for everything. See the [Testing](testing) doc for details.

## test:unit

```sh
npm run test:unit
```

Runs only the unit tests in `tests/unit/` — fast, focused checks of pure logic (type inference, emptiness, link parsing, settings schema, version comparison).

## test:bdd

```sh
npm run test:bdd
```

Runs only the Cucumber BDD scenarios in `tests/features/`, exercising the real filter/operation services against a throwaway copy of the test vault.

## test:verbose

```sh
npm run test:verbose
```

The BDD scenarios with every step printed (✔/✗) and the values each step observed (which notes matched, property values read, counts changed). Use it to confirm a passing test does what you expect, or to debug a failure.

## test:keep

```sh
npm run test:keep
```

Like `test:verbose`, but the throwaway vault copy is **not** deleted after each scenario — the path is printed so you can open the modified notes and inspect the raw YAML. Delete those temp directories manually when done.

## coverage

```sh
npm run coverage
```

Runs the full suite (unit + BDD) under [c8](https://github.com/bcoe/c8) and produces a per-file coverage table plus an HTML report in `coverage/`. Because it includes the BDD run, it reflects the whole project (and lists untested files at 0%).

> c8 requires a Node.js **LTS** (20/22); on very new Node versions it may fail to start due to an upstream dependency lag. This affects only the coverage reporter, never the app or the tests.

## coverage:unit

```sh
npm run coverage:unit
```

Coverage of the unit-tested modules using Node's built-in test-runner coverage. Narrower than `coverage` (it doesn't see the BDD-covered services) but needs no extra tooling and works on any supported Node version.

## check-docs

```sh
npm run check-docs
```

Runs `scripts/check-docs.ts`, which verifies that every expected documentation page exists in the `docs/` folder. Exits with a non-zero code if any page is missing. Intended as a pre-commit check to prevent in-app docs from going stale as new features are added.
