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

## What earns a decision

- **If a user can observe it, it is behaviour.** A choice visible in what
  `validate` prints or what `new` writes belongs in a feature file's scenarios,
  not in the decision log. Writing it in both places means the two will disagree
  eventually.
- **What is left earns a record only if reversing it would cost something** — a
  dependency, a package boundary, a format commitment, an enforcement rule, a
  published contract. Internal structure that a refactor can undo is not a
  decision; the code is its own record.
- **A decision is about the software, not about how we work.** How a phase is
  run, what earns a record, which lint rules are on — that is working practice,
  and it belongs in this file, which can be rewritten, rather than in a log of
  immutable records. This bar is itself an example: it steers what agents write
  and changes nothing about what domainbook does, so it lives here.
- **Mark a decision you took alone.** An agent that decides without the people in
  `decision-makers` weighing the choice sets `authored-by: agent` in the
  frontmatter. Leave it out when they asked for the work and you chose inside
  what they asked for. `decision-makers` still names the people, who are
  accountable either way. See `format/ADR-0019`.

## Checks

Everything CI runs, you can run locally:

```bash
npm run typecheck     # tsc --build, strict
npm test              # vitest
npm run lint          # eslint: typescript-eslint + sonarjs recommended
npm run duplication   # jscpd copy/paste gate
npm run schemas       # regenerate committed JSON Schema; CI fails on drift
npx changeset status --since=origin/main   # CI fails a packages/** change with no changeset
npm audit --audit-level=high --package-lock-only   # CI fails on high or critical
```

**A red audit job may have nothing to do with your PR.** `npm audit` asks the
registry what it knows right now, so the check is not a function of the commit: a
build that passed can fail on a rerun with nothing changed behind it. npm offers
no allowlist and no "as of" date, so the only ways through are to fix the tree or
to wait for the advisory to be withdrawn. Read the advisory before assuming you
broke something.

**The duplication gate is scoped to `packages` and TypeScript** — `.jscpd.json`
ignores `node_modules`, `dist`, generated `schema` output, and `test/fixtures`,
and a clone has to reach five lines and fifty tokens to count. Fixtures are meant
to look like each other; a whole-repo gate would need an ignore list that grows
with every fixture.

**A gate is only trusted if it starts clean.** Both the lint and duplication
gates were adopted with their existing violations fixed first, not grandfathered.
Every failure after that gets argued with rather than waved through.

**One sonarjs rule is off: `no-os-command-from-path`.** domainbook shells out to
`git`, and its hooks shell out to `domainbook`, both by name — resolving them
from `PATH` is the design, not an oversight, and a hook that hard-coded
`/usr/bin/git` would break on half the machines it runs on. The rule is off in
`eslint.config.mjs` rather than disabled at each of the four call sites.

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
- **`npm install` and `npm ci` install the commit hook** through `prepare`,
  which runs `scripts/prepare.mjs`. It builds first if `dist` is missing, and it
  skips itself when `CI` is set or there is no git repo — a hook install has no
  business failing your install or a CI run. This uses `prepare` rather than
  `postinstall` on purpose: `postinstall` is the one that would also fire for
  anyone who merely depends on domainbook, and writing a git hook into someone
  else's repo as a side effect of installing a package is not ours to do. Their
  hook is theirs to install (`enforcement/ADR-0001`, and the scenario in
  `install-the-git-hook.md`).
- Tests accompany the change: unit tests next to the package
  (`packages/*/test`), fixtures under `test/fixtures`.

## Releasing

domainbook publishes to npm from CI with changesets; the version numbers and the
per-package `CHANGELOG.md` files are generated, never hand-edited (`ADR-0014`).

- **Every change to a published package carries a changeset.** `npx changeset`
  writes one — pick the bump per package and describe the change in a sentence,
  which becomes that package's changelog entry. CI refuses a PR that touches
  `packages/**` with none (`changeset status`). A change that needs no release —
  docs, a refactor, a test-only edit — satisfies the gate with an empty changeset:
  `npx changeset --empty`. That is the release twin of the `Skip-Docs:` waiver: an
  intentional, committed "no release here", auditable in the same way.
- **The release runs itself, with no token.** On a push to `main`,
  `.github/workflows/release.yml` opens a "Version Packages" PR that consumes the
  changesets and bumps versions; merging that PR builds and publishes every changed
  package to npm (`npm run release` → `changeset publish`). It authenticates with
  [trusted publishing](https://docs.npmjs.com/trusted-publishers/) over OIDC — the
  workflow's `id-token: write` is the credential, there is no `NPM_TOKEN` secret, and
  provenance is attached automatically. Enabled once: the "Allow GitHub Actions to
  create and approve pull requests" setting, and a trusted publisher on npmjs.com for
  each of the four packages (repository `RafaelAugustScherer/domainbook`, workflow
  `release.yml`, action `npm publish`). This replaces long-lived automation tokens,
  which npm is retiring through 2026–2027.
- **The first `1.0.0` is published by hand.** npm has no pending publisher, so a
  package must exist before its trusted publisher can be registered — the first
  version bootstraps it. Once, from a clean `main` with npm ≥ 11.5.1: `npx changeset
  version`, then `npm ci && npm run build`, `npm login`, then `npx changeset publish`
  and approve each package with 2FA. That first publish carries no provenance (a
  local publish cannot attest); register the trusted publishers after it, and every
  release from `1.0.1` on runs from CI with provenance.
- **The server, the Action, and the plugin publish beside npm.** After the npm
  publish: `mcp-publisher publish` sends `server.json` to the MCP Registry — the
  `mcpName` in `@domainbook/mcp` must match its `name`, and the npm package must be
  live first; a GitHub release with "Publish this Action to the Marketplace" ticked
  lists the root `action.yml`; the Claude Code plugin is already served from
  `.claude-plugin/marketplace.json`, which a consumer adds with `/plugin marketplace
  add RafaelAugustScherer/domainbook`.
