---
title: Configuration
slug: configuration
description: Where Obsidian Valet stores its config.json on each platform, and what's in it
---

# Configuration

Your configuration — the vaults you've added, their forbidden directories and discovered properties, and which vault is active — is saved in a `config.json` file.

Obsidian Valet runs on Linux, macOS, and Windows, and on each system it stores `config.json` in the platform's standard per-user application config directory:

| OS | Location | Comment |
|----|----------|---------|
| **Linux** | `$XDG_CONFIG_HOME/obsidian-valet/config.json` | defaults to `~/.config/obsidian-valet/config.json` |
| **macOS** | `~/Library/Application Support/obsidian-valet/config.json` | |
| **Windows** | `%APPDATA%\obsidian-valet\config.json` | e.g. `C:\Users\<you>\AppData\Roaming\obsidian-valet\config.json` |

The location is detected automatically at runtime, so no setup is needed. A few things worth knowing:

- It lives in your **home/user profile**, not inside the cloned repository — so updating the tool (`git pull` or downloading a new release) never touches your configuration.
- The folder and file are created automatically the first time you add a vault; you normally never edit them by hand.
- It only ever references your own machine — nothing is sent anywhere.
