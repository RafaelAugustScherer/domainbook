# Contributing

domainbook optimizes for one thing: the experience of the person on the other end.
For a user, that means install, setup, and use with as little ceremony as possible.
For a contributor — human or agent — it means code that reads in one pass and a
codebase where the next change is obvious. When a choice trades a benchmark or a
clever abstraction against either of those, the experience wins. We don't chase
performance numbers; we chase the feeling that everything just works.

## Keep it stupid simple

- **Write the obvious version first.** A 6-line `if/else` beats a 3-line lookup
  driven by a config object. Reach for an abstraction when the third real caller
  appears, not in anticipation of it.
- **Solve the case in front of you.** No options bags "for later", no generic
  parameters with one instantiation, no branches for inputs that cannot happen yet.
  Three known inputs today means handle three.
- **Small files, small functions.** When a function needs a scroll to read, split it
  by what each part does and name the parts. `packages/core/src/body/` is the model:
  one artifact per file, short functions with one job each.
- **Fewest moving parts.** Prefer the standard library over a dependency, a value
  over a state machine. Every dependency must pay rent: check
  its current state (maintenance, advisories, size) before adding it, and record the
  choice in a decision if it shapes the design.

## Name things for what they hold

- Plain words over fancy ones: `use` not `leverage`, `check` not `verify the
  invariant`, `file` not `canonicalFilePath`.
- A name states what the value is or what the function does — `termSlug`,
  `bookRoot`, `refuse`, `sortIssues`. If you need a comment to explain a name,
  the name is wrong.
- No explanatory comments. The repo's convention is zero comments in source; the
  only exception is a temporary marker (`TODO`, `FIXME`) that announces its own
  removal. If code needs prose to be understood, rename, restructure, or split it
  until it doesn't. The *why* of a change belongs in the PR description and, when
  it shapes the design, in a decision under `domainbook/`.

## Components talk through interfaces

- **A package's contract is its `src/index.ts`.** Everything a consumer may touch is
  exported there as a named function or type; everything else is internal and free
  to change. The CLI depends on `@domainbook/core` only through that surface —
  never deep-import another package's modules.
- **Contracts are data types, not classes.** Cross-component communication uses
  exported type aliases over plain values — `Book`, `Issue`, `Result` — and pure
  functions that accept and return them. This repo uses `type` aliases for object
  shapes; keep that convention rather than mixing in `interface` declarations.
- **Errors are values.** Core reports problems as `Issue[]`; the CLI turns them into
  a `Result` with exit code and lines. Don't throw across a package boundary —
  throwing is for programmer mistakes, not for expected outcomes like a book that
  fails validation.
- **New surface area is a design decision.** Adding or changing an export in
  `index.ts`, a schema, or an on-disk format needs a matching update to the book
  (or an explicit waiver) — the same rule domainbook will enforce for its users.

## The user comes first

- Every CLI message says what's wrong **and what to do about it**, in a full
  sentence a non-expert can act on. See `packages/cli/src/run.ts` for the tone:
  `"--domain" is not an option here — usage: ...`.
- Zero-config by default: commands work from a fresh checkout with `root`
  defaulting to `domainbook`. A new flag or config key must justify why the
  default isn't enough.
- Failures are ordinary output: print the issues, exit non-zero, no stack traces
  for expected problems.

## Checks

Everything CI runs, you can run locally:

```bash
npm run typecheck     # tsc --build, strict
npm test              # vitest
npm run lint          # eslint: typescript-eslint + sonarjs recommended
npm run duplication   # jscpd copy/paste gate
npm run schemas       # regenerate committed JSON Schema; CI fails on drift
```

The lint config lives in `eslint.config.mjs`. It runs the recommended sets of
`typescript-eslint` and `eslint-plugin-sonarjs` — the sonarjs rules exist to catch
exactly the complexity this document argues against (deep nesting, high cognitive
complexity, duplicated branches). Fix the code rather than disabling a rule; a
`// eslint-disable` needs a reason the reviewer will accept, stated in the PR.

## Workflow

- Work on a branch, open a PR against `main`. Keep each PR to one concern —
  spotted an unrelated issue? Note it in the PR or open a follow-up.
- A change in behavior, format, or a decision updates the book under
  `domainbook/` in the same PR (changelog entry, ADR, or glossary edit as fits),
  or carries an explicit waiver.
- Tests accompany the change: unit tests next to the package
  (`packages/*/test`), fixtures under `test/fixtures`.
