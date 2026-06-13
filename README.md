# Obsidian Valet

[![Latest release](https://img.shields.io/github/v/release/fgsanz/obsidian-valet?sort=semver)](https://github.com/fgsanz/obsidian-valet/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

**Obsidian Valet** is a local web tool (any browser) for bulk manipulation of Obsidian vault notes based on YAML frontmatter properties.

## What it does

Obsidian Valet...

- Filters notes by directory and property values (e.g., links, tags, dates, text)
- Applies bulk operations across matched notes: delete a value, change a value, or move a value between properties
- Leverages Git to take safety checkpoints before and after every operation — in case a rollback is needed
- Works entirely offline — no external services, no information is shared outside your computer, and no AI tokens are spent

## Installation

You do not need to be a developer to use **Obsidian Valet**.

You can either download the tool (and decompress it somewhere locally) or clone the tool repository (if you prefer Git commands), then run the tool from the command line and use it on your browser. All steps are explain bellow.

### Requirements

For the tool to run, you need the following:

- Node.js 20+ [Official instructions](https://nodejs.org/en/download)
- npm [Official instructions](https://docs.npmjs.com/cli/v9/configuring-npm/install)
- Git [Official instructions](https://git-scm.com/install/) (Optional, see below)

### Get the tool

There are two options...

#### Option 1 – Clone the repository

```sh
git clone https://github.com/fgsanz/obsidian-valet.git
cd obsidian-valet
npm install
```

#### Option 2 – Download a release and decompress it

- Download a release archive from the [latest release](https://github.com/fgsanz/obsidian-valet/releases/latest)
- Unzip it locally, anywhere you want, the tool is self-contained
- Open a terminal/console window, go inside the extracted folder and execute the following command:

```sh
npm install
```

#### Optional – Configure Git in your Obsidian vault for safe rollback

Obsidian Valet is **safe**. If you care enough about safety, you can find in the tool detailed documentation about the text cases and you can run them yourself.

Regardless and to be extra careful, it is highly recommended that you run Git in your Obsidian vault. This is also safe and **no information leaves your computer** unless you also decide to push the vault to GitHub or Gilab in the cloud.

If you setup Git in your local vault, Obsidian Valet can use Git to safely (and optionally) push local commits before and after performing bulk operations, in case you decide to roll them back.

> Safe rollbacks, locally.

Open a terminal/console window, go inside your Obsidian vault and execute the following command:

```sh
cd {path to your Obsidian vault}
git init 
```

## Getting started

### Run the tool

Open a terminal/console window, go inside the extracted folder and execute the following command:

```sh
npm start
```

The server starts typically on port 3741 (or the next available port) and opens the app in your browser. The app prints the URL to the console.

### Add your vault and get busy

On your browser:

- On the **Vaults** page:
  - Add the location of your Obsidian vault
  - Optionally, add one or several forbidden directories so the tool ignores them
- You are now ready to perform bulk **Operations** on your notes

## New releases

Released versions are published on the [Releases page](https://github.com/fgsanz/obsidian-valet/releases). The newest one is always at:

- https://github.com/fgsanz/obsidian-valet/releases/latest

Each release includes downloadable archives — a named source `.zip` (`obsidian-valet-<version>.zip`) plus GitHub's automatic "Source code" `.zip`/`.tar.gz`. See [CHANGELOG.md](CHANGELOG.md) for changes in each version.


## For developers

Running the tool this way automatically takes on the changes you made to the source code:

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

Your configuration — the vaults you've added, their forbidden directories and discovered properties, and which vault is active — is saved in a `config.json` file. **Obsidian Valet runs on Linux, macOS, and Windows**, and on each it stores this file in that platform's standard per-user application config directory:

| OS | Location |
|----|----------|
| **Linux** | `$XDG_CONFIG_HOME/obsidian-valet/config.json` (defaults to `~/.config/obsidian-valet/config.json`) |
| **macOS** | `~/Library/Application Support/obsidian-valet/config.json` |
| **Windows** | `%APPDATA%\obsidian-valet\config.json` (e.g. `C:\Users\<you>\AppData\Roaming\obsidian-valet\config.json`) |

The location is detected automatically at runtime, so no setup is needed. A few things worth knowing:

- It lives in your **home/user profile**, not inside the cloned repository — so updating the tool (`git pull` or downloading a new release) never touches your configuration.
- The folder and file are created automatically the first time you add a vault; you normally never edit them by hand.
- It only ever references your own machine — nothing is sent anywhere.
