# Obsidian Valet

A local web tool for bulk manipulation of Obsidian vault notes based on YAML frontmatter properties.

## What it does

- Filter notes by directory and property values — links, tags, dates, text, and more
- Apply bulk operations across matched notes: delete a value, change a value, or move a value between properties
- Leverages Git to take safety checkpoints before and after every operation — in case a rollback is needed
- Works entirely offline — no external services, no information is shared outside the computer, no AI tokens are spent

## Requirements

- Node.js 20+
- npm

## Install

```sh
git clone https://github.com/fgsanz/obsidian-valet.git
cd obsidian-valet
npm install
```

## Run

```sh
npm start
```

The server starts on port 3741 (or the next available port) and opens the app in your browser. The app prints the URL to the console.

## Development

```sh
npm run dev
```

Runs Vite dev server (port 5173) and the API server (port 3741) concurrently with hot reload.

## Configuration

Vault definitions are stored at `~/.config/obsidian-valet/config.json`. Go to the **Vaults** page in the app to add vaults.

## Project structure

```
src/
  shared/      # Types, schemas, and constants shared between server and client
  server/      # Fastify API server — config, routes, services
  client/      # React frontend — pages, components, API client
docs/          # Documentation served by the app at /docs
scripts/       # check-docs.ts — validates docs coverage
tests/         # Test cases, written BDD style
```

## Renaming the tool

The tool name is defined in one place: `src/shared/constants.ts`. Changing `APP_NAME` there cascades to the UI, console output, git commit templates, and documentation headings.
