---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Carry history in git, not snapshot folders

## Context and Problem Statement

Documentation catalogs commonly version themselves by copying: a `v1/` folder
frozen beside the working one. The book has to answer "what did this context look
like at release 1.2" somehow, and the copy-on-version approach is the established
answer in this category.

## Decision Drivers

- The book lives in the repo it documents, and that repo already has a full
  history of every file.
- Copied folders drift: someone fixes a typo in the live copy and nowhere else,
  and the archive slowly becomes fiction.
- Enforcement maps code paths to book paths. Duplicated books multiply the paths
  a change might have to touch.

## Considered Options

- Snapshot folders per version, copied on release.
- Git-native: one book, with the changelog and ADR supersede chains carrying what
  changed and why.
- An external store holding versioned documents outside the repo.

## Decision Outcome

Chosen option: "Git-native". The repository already stores every previous state
of every file, correctly, for free. A second copy inside the same repo is a
manual process that can only be wrong.

Two artifacts carry the narrative git cannot: the changelog says what changed for
a reader, and the supersede chain says which decision replaced which.

### Consequences

- Good, because there is exactly one copy of every page and no release-time
  copying step.
- Good, because `git log` on a book file is a real, complete audit trail.
- Bad, because reading the book as of an old release means checking out a tag —
  a git operation, not a link.
- Bad, because the published site shows one version; a reader on the site cannot
  compare releases without the repo.
- Bad, because an accepted ADR being immutable is now a rule people follow rather
  than a folder that enforces it (`format/ADR-0004`).

### Confirmation

No folder in the book is named after a version. A release adds a dated changelog
section, and a reversed decision adds a new ADR marking the old one superseded.
