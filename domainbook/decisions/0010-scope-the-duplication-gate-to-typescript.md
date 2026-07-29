---
status: accepted
date: 2026-07-29
decision-makers: [rafael]
---

# Scope the duplication gate to TypeScript

## Context and Problem Statement

jscpd was added to CI to fail a build that copies logic instead of sharing it.
Run over the whole repo it finds twelve clones and not one of them is TypeScript:
ten are markdown under `packages/core/test/fixtures/`, one is the generated
`packages/core/schema/changelog.schema.json` repeating its own shape, and one is
a pair of this book's own domain pages.

Every one of those is repetition the project asks for. A broken fixture is the
valid file with one field changed — that is what makes a failing test name one
rule. Generated output is generated. Two canvases share a table header because
the canvas fixes which sections come in which order and what a communication
table looks like. Gating that number would fail the build for the design, and
each fixture Phase 1 adds makes it worse.

## Decision Drivers

- The clones outside TypeScript are all structural: fixtures that differ in one
  field, generated output, and the fixed shape of an artifact.
- Scoped to TypeScript the repo measures 0.00%, so the gate starts with no debt
  and every failure it ever reports is about code somebody wrote.
- A gate that has to be argued with on the day it is added is never trusted
  afterwards.
- jscpd 5.x is a rewrite, seven weeks old and ten releases in, from a single
  maintainer; about three quarters of the package's weekly downloads are still
  on the 4.x engine.

## Considered Options

- Scope to `packages` and TypeScript, at `minTokens: 50` / `minLines: 5`,
  threshold 5.
- Gate the whole repo and add an ignore entry per fixture as each one trips it.
- Raise the threshold until the whole repo passes as it stands.
- No duplication gate.

## Decision Outcome

Chosen option: "Scope to `packages` and TypeScript". `.jscpd.json` sets
`path: ["packages"]` and `format: ["typescript"]`, ignoring `node_modules`,
`dist`, the generated `schema` output, and `test/fixtures`. `minTokens: 50` and
`minLines: 5` mean a clone has to run to five lines and fifty tokens before it
counts, so a shared import block or a repeated type signature does not. Threshold
5 is the value jscpd's own CI and hook examples use, and it means something only
because the scoped figure starts at zero: the bar is set where the code is, not
where it would have to be to let the markdown through.

A whole-repo gate with per-fixture ignores was rejected because the ignore list
would grow with every fixture, and reviewing it would mean deciding whether each
new fixture is allowed to look like the others — a question about the tests,
asked in the wrong file. Raising the threshold was rejected because it sets the
bar by what the markdown happens to measure today and has to move again every
time a document is written.

`jscpd@5.0.14` is pinned exactly. If the rewrite misbehaves the fallback is
`jscpd@4.2.5`, the last release of the engine most of the ecosystem still runs;
it reads the same config file and returns the same exit codes, so the retreat is
one version number and no other change.

### Consequences

- Good, because a failure means somebody copied TypeScript, which is the only
  thing the gate was added to catch.
- Good, because the gate starts at zero: nothing has to be grandfathered and
  there is no baseline to argue about.
- Bad, because copy-and-paste in the fixtures, the schemas, and the book goes
  unmeasured — and the book is where this project most insists on not repeating
  itself.
- Bad, because a percentage threshold moves with the size of the tree. Five
  percent of today's TypeScript is about forty-seven lines; the same five
  percent will be hundreds later, so the gate is strictest now and loosens as
  the codebase grows.
- Bad, because jscpd 5.x is young and singly maintained, and it now sits in the
  path of every build. The fallback is recorded, but taking it is still a commit
  made under pressure.

### Confirmation

`npm run duplication` exits 0 on the current tree and reports 0.00% across 17
TypeScript files. Copying one existing schema file to a second name takes it to
6.35% and exit 1 — the gate has been seen to fail, not only to pass.

## More Information

`ADR-0009` is the other gate on the same workflow. What this one ignores is the
golden fixture set, which Phase 0 of the roadmap describes.
