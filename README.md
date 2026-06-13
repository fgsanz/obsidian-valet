# Obsidian Valet

[![Latest release](https://img.shields.io/github/v/release/fgsanz/obsidian-valet?sort=semver)](https://github.com/fgsanz/obsidian-valet/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

A local web tool for bulk manipulation of Obsidian vault notes based on YAML frontmatter properties.

## What it does

- Filter notes by directory and property values — links, tags, dates, text, and more
- Apply bulk operations across matched notes: delete a value, change a value, or move a value between properties
- Leverages Git to take safety checkpoints before and after every operation — in case a rollback is needed
- Works entirely offline — no external services, no information is shared outside the computer, no AI tokens are spent

## Getting started

You do not need to be a developer to use **Obsidian Valet**. You just need to download the tool (and decompress the file) or clone the repo (if you are more comfortable with Git commands) and run the tool from the command line. All steps are explain bellow.

### Requirements

In order to run the tool, you need the following in your computer. Installation guidelines depend on your system, refer to the official guidelines:

- Node.js 20+
- npm

### Installation

#### Option 1 – Clone the repository

```sh
git clone https://github.com/fgsanz/obsidian-valet.git
cd obsidian-valet
npm install
```

#### Option 2 – Download and decompress a tool release

- Download a release archive from the [latest release](https://github.com/fgsanz/obsidian-valet/releases/latest)
- Unzip it anywhere you want
- Open a terminal/console window, go inside the extracted folder and execute the following command:

```sh
npm install
```

### Run the tool and use it from your browser

Open a terminal/console window, go inside the extracted folder and execute the following command:

```sh
npm start
```

The server starts typically on port 3741 (or the next available port) and opens the app in your browser. The app prints the URL to the console.

## New releases

Released versions are published on the [Releases page](https://github.com/fgsanz/obsidian-valet/releases). The newest one is always at:

- https://github.com/fgsanz/obsidian-valet/releases/latest

Each release includes downloadable archives — a named source `.zip` (`obsidian-valet-<version>.zip`) plus GitHub's automatic "Source code" `.zip`/`.tar.gz`. See [CHANGELOG.md](CHANGELOG.md) for changes in each version.


## For developers

```sh
npm run dev
```

Runs Vite dev server (port 5173) and the API server (port 3741) concurrently with hot reload.

### Project structure

```
src/
  shared/      # Types, schemas, and constants shared between server and client
  server/      # Fastify API server — config, routes, services
  client/      # React frontend — pages, components, API client
docs/          # Documentation served by the app at /docs
scripts/       # check-docs.ts — validates docs coverage
tests/         # Test cases, written BDD style
```

### Configuration

Vault definitions are stored at `~/.config/obsidian-valet/config.json`. Go to the **Vaults** page in the app to add vaults.
