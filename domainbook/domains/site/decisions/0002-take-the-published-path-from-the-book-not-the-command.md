---
status: accepted
date: 2026-08-02
decision-makers: [RafaelAugustScherer]
---

# Take the published path from the book, not the command

## Context and Problem Statement

A static site published at the root of a host and the same site published under
`/<repo>/` — where a GitHub Pages project site lives — do not have the same
links in them. Astro resolves internal links and asset URLs against its `base`
at build time, so the mount path has to be known before the build runs, not
after. Something has to tell `domainbook build` where the output is going.

## Decision Drivers

- Phase 4's exit criterion is this book published as the live demo, and that
  demo is a project site under a path.
- `CONTRIBUTING.md` holds that a new flag or config key must justify why the
  default is not enough, so exactly one of the two should exist.
- The path is stable for the life of a repo and is the same for every person and
  every workflow that builds it.

## Considered Options

- A `site.base` key in `domainbook.config.yaml`.
- A `--base <path>` flag on `domainbook build`.
- The `astro-relative-links` integration, so output is relative and neither
  exists.

## Decision Outcome

Chosen option: "A `site.base` key in `domainbook.config.yaml`". Where a book
publishes is a fact about the book, not about the invocation that happened to
build it. A flag has to be repeated by every workflow and every person who
builds, and a flag that is wrong produces a site whose links all break in a way
the build cannot detect — the key is written once, reviewed once, and read by
`serve` and `build` alike, so what a reader sees locally is what publishes.

The integration was rejected on maintenance rather than on design: it was last
published in December 2024, it hooks Astro's build internals, and its peer range
is open-ended, so an Astro release can break the output silently. Astro itself
offers no relative-output mode, which is why an integration exists at all.

### Consequences

- Good, because `domainbook build` takes no argument, and a Pages workflow is
  the bare command.
- Good, because `serve` reads the same key, so the local site is mounted where
  the published one will be.
- Bad, because the key is a format commitment: it is in the config schema and
  the generated JSON Schema, and removing it later is a breaking change.
- Bad, because one book builds for one mount path. Publishing the same book to
  two hosts at different paths takes two checkouts with two configs.
- Neutral, because a book that says nothing still builds for the root of a
  host, which is what a user or org Pages site and most static hosts serve.

### Confirmation

`domainbook build` on a book whose config carries no `site.base` produces a site
that loads at `/`; the same book with `site.base: /domainbook/` produces one
that loads under that path, and neither needed an argument. A value that does
not start with a slash is refused by the schema before anything is written.
