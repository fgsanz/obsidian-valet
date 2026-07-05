# Feature specs

Internal, working requirements for features to be built. This is **not** the
published product documentation (that lives in `docs/`) — it's the design input:
requirements, acceptance criteria, and mockups for work that is planned or in
progress.

## Layout

```
specs/
  README.md                     # this index / status board
  <feature-slug>/               # kebab-case, one folder per feature
    requirements.md             # the spec, acceptance criteria, notes
    assets/                     # mockups & screenshots
      <image>.png
```

## Conventions

- **One folder per feature.** Keeps a feature's markdown and images together so
  nothing goes stale or orphaned.
- **Images live in `assets/`** and are referenced with relative links
  (`![alt](assets/overview.png)`) so they render in any markdown viewer.
- **Slugs are kebab-case** (e.g. `filter-notes-grouping`), matching `docs/`.
- **Status** is tracked in each `requirements.md` front matter
  (`planned` / `in-progress` / `shipped`) and reflected in the table below.
  Shipped features can be moved to an `archive/` subfolder to keep this list
  focused on active work.

## Features

| Feature | Status | Spec |
|---------|--------|------|
| _none yet_ | — | — |
