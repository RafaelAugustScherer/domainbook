---
status: open
date: 2026-07-30
severity: medium
quadrant: inadvertent-prudent
code:
  - packages/core/src/check/common.ts
  - packages/core/src/load/disk.ts
  - packages/core/src/load/log.ts
  - packages/core/src/log.ts
  - packages/cli/src/files.ts
  - packages/cli/src/new.ts
decisions: [core/ADR-0006, core/ADR-0007, ADR-0010]
---

# Helpers are copied between core and the CLI

## Debt

Six helpers are written more than once, and one descriptor holds a copy of data
rather than of code. All of it sits on both sides of the package boundary.

- `pad` has three copies with identical bodies: private in `load/log.ts`,
  exported from `check/common.ts`, and again in the CLI's `files.ts`. Two of the
  three are inside core.
- `relate` has two byte-identical copies, in `load/disk.ts` and in `files.ts`.
- `entries` has two copies with one name and two contracts. Core's returns
  `Dirent[]` behind a stat guard; the CLI's returns `string[]` and calls
  `readdirSync` with no guard at all, which is the same fault `TDR-0002` records.
- The CLI's `new.ts` carries its own `Kind` descriptor, and `debtKind` holds
  `"debt"` and `"debt record"` — which are `debtLog.dir` and `debtLog.one` from
  core's `log.ts`, written a second time on the other side of the boundary. Not
  by choice: `LogKind` and its two values are internal to core, so the CLI
  cannot read them even though `core/ADR-0007` made them the one place those
  words live. This was one copy while `decisionKind` stood alone; Phase 1.1
  made it two.
- `notNfc`, `notNfkc`, and `tooLong` have one copy each in `check/common.ts` and
  in the CLI's `new.ts`. The detection is identical, because `core/ADR-0006`
  moved the arithmetic into one module and both sides call it. The sentences have
  drifted: the CLI names the exact string to write instead and core does not,
  core ends `shorten it` where the CLI ends `write a shorter one`, and core
  leaves the word "bytes" off the limit.

Only the last group was foreseen. `core/ADR-0006` wrote it into its Consequences
— the arithmetic is unified and the prose "can drift where the numbers now
cannot" — and said the gate would not find the next one. It did not, and the
prose has since drifted. The other four copies accumulated with nobody weighing
them at all.

## Impact

The cost that is already being paid is a rule that answers differently depending
on which command the reader ran. A title that is not in NFC is refused by
`domainbook new decision` with the replacement string spelled out, and reported
by `domainbook validate` without it — one rule, two answers, and no way for the
reader to know they are the same rule. The product's voice is what `init`, `new`,
and `validate` print, so two voices for one fault is a defect in the surface, not
a tidiness complaint.

The cost still to come is `entries`. Someone who repays `TDR-0002` by guarding
core's read has no reason to open `files.ts`, so the unguarded copy keeps its
home and the crash survives its own fix. Every one of the seven behaves this
way: the first change to any of them has to be made twice, by someone who
already knows both exist.

`Kind` fails in the same shape and is the cheapest of the seven to trigger.
Rename the debt folder in the format and core follows — the descriptor, and the
two lists of known folder names that sit beside it — but `new debt` keeps
writing to `debt/`, and `validate` answers the file the tool has just written
with `the format does not know this folder`. Two commands of one binary
disagreeing about where an artifact lives is the worst reading of this record,
because the reader has no reason to suspect either one.

The gate cannot see any of it, and this is the part that will not improve on its
own. `.jscpd.json` counts a clone only at five lines and fifty tokens
(`ADR-0010`). `pad` and `relate` are three-line bodies, and the message family
diverged past the token threshold before anyone read it. So the copies grow at
whatever rate the two packages grow, and CI stays green the whole way.

## Remedy

`pad` and `relate` become one export each, read by both packages through core's
`src/index.ts` — the CLI already depends on core and on nothing else
(`core/ADR-0001`), so the import costs nothing. Core's own two copies of `pad`
collapse first, since neither of them crosses a boundary to begin with.

`entries` becomes one function with one contract, and it lands together with the
fix `TDR-0002` describes, so the CLI inherits a guarded read rather than growing
a second unguarded one.

`Kind` needs a decision rather than a move, because the fix is on core's
published surface: the CLI can only stop copying `debtLog.dir` and `debtLog.one`
if core names them where the CLI can read them. That is the one case in this
record where `TDR-0001`'s rule argues *for* an export — a consumer is asking,
which is exactly when a name earns its place on `index.ts`. Weigh publishing
`LogKind` and its two values against giving the CLI a narrower reader, and take
whichever leaves one owner for the word `debt`.

The message family stays two functions and one rule. `core/ADR-0006` was right
that a refusal about a title not yet written and an issue about a file already on
disk are different speech acts. What has to go is the drift: one wording for the
limit, one for the remedy, agreed once and asserted in both test suites. That is
the honest end state, because the gate will not catch the next divergence either
— copies that share meaning but not text are found by reading, and this record is
where the reading is written down.
