---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Give the runtime and the CLI a context of their own

## Context and Problem Statement

Phase 0 drew four contexts — format, enforcement, mcp, site — and gave format
every file under `packages/core`. That was true while `packages/core` was only
schemas. Phase 1 put a loader, a model graph, reference resolution, convention
checks and a CLI into the same package, and `packages/cli/**` was claimed by
nobody at all.

The `code:` globs are the only map from a change to the documentation it has to
update (`enforcement/ADR-0001`). So an unclaimed package is a change nothing can
block, and a context that claims code it does not describe sends the author to a
page that cannot help. Enforcement's own page carried this as an open question.

## Decision Drivers

- format's canvas describes a specification: what an artifact is, what its
  frontmatter carries, what its body must look like. It says nothing about a
  loader, an error message, or a command, and a reader sent there by a change to
  `load.ts` learns nothing.
- Phase 2's staged-diff check lands in the same package as the loader, so
  whichever context owns the runtime owns where that code sits.
- Every context has to be small enough that its page is worth reading. Four
  contexts where one holds half the repo is a map that flatters itself.

## Considered Options

- One new context for the runtime and the CLI together, leaving format the spec.
- Split `packages/cli/**` per command file across the four existing contexts —
  `validate` to format, `check` and `hooks` to enforcement, `mcp` to mcp,
  `dev`/`build` to site.
- Leave everything under format and accept that its globs are wider than its
  page.

## Decision Outcome

Chosen option: "One new context, `core`". The runtime and the CLI change
together, ship together, and are read by the same person; splitting the CLI per
command would map one file to four books and make every commit ambiguous.

The globs are split like this:

- **format keeps the spec**: `packages/core/src/schemas/**`,
  `packages/core/src/frontmatter.ts`, `packages/core/schema/**`,
  `packages/core/scripts/**`, `packages/core/test/fixtures/**`. The fixtures stay
  with format because a fixture is a worked example of the spec — adding a rule
  means adding the fixture that proves it (`format/ADR-0003`).
- **core takes the runtime**: `packages/core/src/body/**`, `check.ts`,
  `index.ts`, `issue.ts`, `load.ts`, `model.ts`, `validate.ts`,
  `packages/core/test/*.ts`, and `packages/cli/**`. The tests that run the
  fixtures are core's even though the fixtures are format's: one says what the
  spec is, the other says what the runtime does with it. The test glob takes
  every file directly under `test/`, helpers included, so no file there is left
  unmapped; `test/fixtures/**` sits a level down and stays with format.

core is downstream of format and conformist — it consumes the zod schemas as
they are and translates nothing.

### Consequences

- Good, because a change to `load.ts` or to a CLI message now names a page that
  describes a loader and a CLI, and `packages/cli/**` can be blocked at all.
- Good, because format's page stops carrying `LoadBook`, a message it never
  implemented and now never will.
- Bad, because the context is named after one of its two packages: `core` has to
  be read as "the runtime and the CLI", and a reader who sees `domainbook` the
  CLI package has to know it is documented under `domains/core/`.
- Bad, because adding a validation rule usually touches a fixture (format) and a
  checker (core) in the same commit. Enforcement's "one commit touches two
  domains" question is now routine rather than hypothetical.
- Bad, because `packages/core/package.json`, the tsconfigs, and the workspace
  root files still belong to no context — they hold both contexts' dependencies
  in one file, so mapping them to either would block the wrong page.
- Bad, because five pages is one more to keep true, and the two that split are
  the two most edited.

### Confirmation

The split is only true while the globs cover the files: every file under
`packages/core/src` and `packages/cli` matches exactly one of the two lists.
Phase 2's `domainbook check` is what will hold a change to that.

## More Information

The map this changes is on the domain pages themselves — `domains/core/index.md`
declares the relationship with format, and mcp and site now read the book through
core rather than through format. Relationships are declared once, from either
side (`format/ADR-0006`).
