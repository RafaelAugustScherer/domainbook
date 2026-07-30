---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Write the working rules down and lint for them

## Context and Problem Statement

The rules this repo works by — the obvious version first, plain names, no
explanatory comments, packages talking only through their `src/index.ts` over
plain data types, errors returned as `Issue[]`/`Result` values rather than
thrown across a boundary, the user's experience ahead of any benchmark — lived
in agent instructions and review habits, nowhere a contributor could read them.
And the slice of them a machine can check went unchecked: the tree carried
seventeen violations of the recommended TypeScript and sonar rule sets, most of
them exactly the complexity the unwritten rules forbid.

## Decision Drivers

- A rule that lives in review habit is applied when the reviewer notices; a rule
  in CI is applied every time, to humans and agents alike.
- Most of the working rules are judgment — what to name a thing, when an
  abstraction has earned its place — and no linter checks judgment. The document
  and the gate cover different ground and need each other.
- Like the duplication gate (`ADR-0010`), a lint gate is only trusted if it
  starts clean: adopt it with violations grandfathered and every failure after
  that gets argued with.
- A recommended set is maintained by the people who wrote the rules; a
  hand-picked list is a config nobody re-reads.

## Considered Options

- A root `CONTRIBUTING.md` plus eslint running the `@eslint/js`,
  `typescript-eslint`, and `eslint-plugin-sonarjs` recommended sets as a
  required CI step.
- `CONTRIBUTING.md` alone, no lint step.
- eslint with `@eslint/js` recommended only.
- A rule list hand-picked to mirror the document.

## Decision Outcome

Chosen option: the document plus the three recommended sets. `CONTRIBUTING.md`
at the repo root states the philosophy — keep it stupid simple, name things for
what they hold, components talk through each package's `src/index.ts` contract
in plain data types, errors are values, the user comes first, no premature
optimization. `eslint.config.mjs` (flat config, eslint `10.8.0`) runs the
recommended sets of `@eslint/js`, `typescript-eslint` `8.65.0`, and
`eslint-plugin-sonarjs` `4.2.0` over every package, wired as `npm run lint` and
as a CI step between typecheck and test. The sonarjs set is why there are three
and not two: its cognitive-complexity, deep-nesting, and duplicated-branch
rules are the machine-checkable slice of the document.

The seventeen violations the gate found were fixed before it was wired in:
complexity splits in core's check and section readers and in the CLI's `run`
and `new`, two super-linear regexes rewritten, nested templates extracted, one
test parameterized, and a seeded generator in place of `Math.random` in a test.
Behavior is unchanged — all 356 tests pass.

The document alone was rejected because its most mechanical rules would still
go unread by the one reader that never skims. `@eslint/js` alone was rejected
because it knows nothing of TypeScript and nothing of complexity, which is the
failure the document argues against. A hand-picked list was rejected for the
same reason the duplication threshold was not tuned to the markdown
(`ADR-0010`): it sets the bar by what the tree happens to hold today and has to
be re-argued every time it pinches.

### Consequences

- Good, because deep nesting, high cognitive complexity, and duplicated
  branches now stop a merge instead of waiting for a reviewer to name them.
- Good, because the gate starts at zero: nothing is grandfathered, so every
  failure it ever reports is about the change in front of it.
- Good, because a contributor — human or agent — has one document that says how
  this repo works, and the checks it names are the ones CI runs.
- Bad, because the gate now holds the compiler in place:
  `eslint-plugin-sonarjs` `4.2.0` depends on `typescript >=5 <6.1.0` and
  `typescript-eslint` `8.65.0` declares the same cap, so the pin from
  `ADR-0004` cannot move to a future TypeScript 6.1+ until both raise their
  caps. That ADR's revisit now has a second set of ranges to check.
- Bad, because "recommended" moves with the plugins: an upgrade can add rules
  and turn a green tree red with no code change behind it.
- Bad, because most of the document is not lintable — the gate can pass while
  the naming and contract discipline it backs is broken. Prose is steering;
  only the mechanical slice is enforced.

### Confirmation

`npm run lint` exits 0 on the current tree, and the workflow runs it as a
required step between typecheck and test. The gate has been seen to fail: on
adoption it reported seventeen violations, and each was fixed in code rather
than waived with a disable comment.

## More Information

`ADR-0009` and `ADR-0010` are the other gates on the same workflow. `ADR-0004`
pins the compiler these plugins cap; the pin and the caps now hold each other.
The prose this gate backs is `CONTRIBUTING.md` at the repo root — uppercase
because it is a repo-root ecosystem file, not a book artifact
(`format/ADR-0003`).
