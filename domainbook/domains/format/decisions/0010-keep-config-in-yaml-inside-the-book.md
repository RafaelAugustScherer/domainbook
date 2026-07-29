---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Keep config in YAML inside the book

## Context and Problem Statement

domainbook needs a small amount of configuration — the enforcement mode, the
waiver trailer key, whether a reason is required of everyone or only of agents.
Where that file lives and what it is written in decides who can read it: a git
hook, a GitHub Action, an editor, and possibly a tool that is not JavaScript at
all.

## Decision Drivers

- The config is read by a commit hook on every commit, so evaluating it must not
  mean loading a module.
- Anything the CLI validates should be validatable by an editor too, and that
  means a schema (`format/ADR-0001`).
- Configuration that can execute code is configuration that cannot be trusted
  from a cloned repo.

## Considered Options

- YAML at `<book-root>/domainbook.config.yaml`, validated by schema.
- A JavaScript config file (`domainbook.config.js`) exporting an object.
- A key inside the repo's `package.json`.

## Decision Outcome

Chosen option: "YAML at `<book-root>/domainbook.config.yaml`". A JS config would
let a repo compute its globs, but it runs on `git commit` in a checkout of
someone else's branch, and the flexibility is not worth that. `package.json`
would tie the book to a Node repo, and the book is meant to document repos in any
language.

The file lives *inside* the book, so it carries no `root` key: the book root is
an argument to the tool, defaulting to `domainbook/`. A book cannot say where it
is, because you must already have found it to read the file that says so.

Every field has a default. A book with no config file at all behaves exactly like
a book whose config is empty.

### Consequences

- Good, because the hook reads a small YAML file, and the same file is validated
  by the editor from the committed JSON Schema.
- Good, because a repo cloned from anywhere runs no code from its config.
- Bad, because dynamic configuration is impossible; a repo wanting per-branch or
  computed settings has no way to express it and will ask.
- Bad, because a repo with a book somewhere other than `domainbook/` has to pass
  the root to every invocation — hook, Action, and CLI — and getting one of them
  wrong looks like an empty book rather than an error.

### Confirmation

The fixture config sets every field explicitly and a test parses the empty object
to the same result, so the defaults are checked to match the documented ones.
