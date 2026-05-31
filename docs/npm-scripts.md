---
title: npm scripts
slug: npm-scripts
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

## check-docs

```sh
npm run check-docs
```

Runs `scripts/check-docs.ts`, which verifies that every expected documentation page exists in the `docs/` folder. Exits with a non-zero code if any page is missing. Intended as a pre-commit check to prevent in-app docs from going stale as new features are added.
