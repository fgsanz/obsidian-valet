---
title: Git and cloud-sync folders
slug: git-cloud-sync
description: Why Git can fail inside OneDrive/Google Drive/Dropbox folders, and how to fix or avoid it
---

# Git and cloud-sync folders

Beware of the following scenario:

> If the Obsidian vault sits on a location that is a mounted **cloud storage** (e.g., Microsoft OneDrive, Google Drive, DropBox), then you may experience issues with Git.

There are ways to workaround the problem, and there are ways to avoid the problem 🤔.

## Root cause

When the vault lives on a **cloud storage** which uses "files on-demand" feature, some files may be cloud-only stubs and not fully downloaded locally. In that case, when `git add -A` tries to `mmap` (memory-map) those files for hashing, the computer's OS must fetch them from the cloud, and that fetch times out before git's `mmap` operation completes.

## How to fix

Out of all the choices below, **Option 1** (and eventually Option 2) is the immediate fix. **Option 3** is the right architectural choice — my suggestion.

1. **Force local download of all files first** — In the computer, (this depends on the cloud storage system) force "always keep on this device". Wait for the sync to complete (e.g., files show local icon, not a cloud icon). Then retry `git add -A`.

2. **Alternatively, disable mmap in git**: It is less ideal, but works around the problem. Located at the root of the Obsidian vault, execute this command on a terminal/console:

```
git config core.preloadindex false
```

3. **Separation of concerns** Long-term, recommended choice. Running a Git repo inside a live cloud-sync folder is generally problematic — the cloud solution can interfere with .git internals (locking index files, uploading partial writes, etc.). Consider keeping the repo on a local path and only syncing the working files via OneDrive, or using a dedicated git remote (GitHub/GitLab) instead of OneDrive as your backup.
