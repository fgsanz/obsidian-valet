---
title: Upgrading the tool
slug: upgrading
description: The two ways to upgrade Obsidian Valet — git pull or a fresh binary download
---

# Upgrading the tool

There are two ways to move to a newer version of Obsidian Valet. Both keep your settings: your
configuration lives in your per-user config directory, **outside** the tool's folder, so upgrading
never touches it (see [Configuration](configuration)). The new version picks up exactly where the old one left off.

## Which method should I use?

Good to know: Regardless of your choice, your vaults, forbidden directories, discovered properties, and active vault are preserved automatically 👍

| | Git | Download a release |
|---|---|---|
| **How you update** | One command: `git pull` | Download, unzip, replace the folder |
| **Pros** | • Fastest — a single command<br>• Keeps full version history<br>• Easy to switch between or roll back versions<br>• No file shuffling | • No Git installation required<br>• Self-contained — just a folder you can put anywhere |
| **Cons** | • Requires Git installed<br>• Requires you originally cloned the repo (not a download) | • Manual each time: download, decompress, and delete the old folder<br>• No built-in version history |
| **Best for** | Anyone comfortable with a terminal who already cloned the repo | Anyone who prefers not to install or use Git |

---

## Method 1 – Git

If you originally got the tool with `git clone`, update it in place:

```sh
cd path/to/obsidian-valet
git pull
npm install   # in case dependencies changed
npm start
```

`npm install` is safe to run every time; it's a quick no-op when nothing changed.

---

## Method 2 — Download a release

If you installed by downloading a release archive:

1. Download the latest archive from the [releases page](https://github.com/fgsanz/obsidian-valet/releases/latest).
2. Decompress it anywhere you like — the tool is self-contained.
3. Inside the new folder, install and run it:

   ```sh
   npm install
   npm start
   ```

4. Once the new version runs correctly, delete the old folder.


