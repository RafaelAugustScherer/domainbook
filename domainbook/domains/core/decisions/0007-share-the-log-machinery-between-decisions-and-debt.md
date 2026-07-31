---
status: deprecated
date: 2026-07-30
decision-makers: [RafaelAugustScherer]
---

# Share the log machinery between decisions and debt

## Context and Problem Statement

A debt log is the decision log's twin (`ADR-0013`): `NNNN-<slug>.md` in a folder,
four-digit numbers from 0001 with no gaps, never reused, a title that has to
match the filename, and the same loader work — read every numbered file, parse
frontmatter, parse a body, keep the files that failed so numbering still sees
them.

All of that existed for decisions in `load/decision.ts` and `check/log.ts`. The
cheap way to ship debt was to copy both and change the words. The question is
whether one machine serves two logs or two machines serve one each.

## Decision Drivers

- Abstraction is earned at the second or third real caller
  (`CONTRIBUTING.md`). Debt is a real second caller today, not a predicted one.
- The two logs' rules are not similar, they are the same rules: nothing about
  numbering or filenames differs, and only `status` and the body differ at all.
- Two copies drift, and drift in a checker means a rule quietly holds for one
  log and not the other — the failure `core/ADR-0006` had already found once in
  the slug rules.
- Messages are the product (`core/ADR-0003`), and a message shared between two
  artifacts has to read as English for both.

## Considered Options

- One `LogKind<T>` descriptor per log, with the loader and the checks
  parameterised by it.
- Copy the loader and the checks, and keep the two logs independent.
- Share the loader only, and leave the checks copied, since checks are where the
  wording lives.

## Decision Outcome

Chosen option: "one descriptor, two values". `packages/core/src/log.ts` holds

```ts
type LogKind<T> = {
  dir: string;   // "decisions" | "debt"
  ref: string;   // "ADR" | "TDR"
  one: string;   // "decision" | "debt record"
  keys: string;  // the frontmatter-keys sentence
  schema: ZodType<T>;
  body: (file, nodes) => { title, issues };
};
```

with exactly two values, `decisionLog` and `debtLog`. `load/decision.ts` became
`load/log.ts` and takes a kind; `checkNumbers` and `checkTitles` in
`check/log.ts` run over every log in the book; `logDir` takes the folder name.
`DecisionFile` was renamed `LogFile`, and a decision record and a debt record
are both `LogRecord<T>` — two structurally identical exported types would have
been worse than one rename, and nothing is published yet.

`checkSupersedes` stays decision-only, because it has no twin: a debt record has
no supersede status. It is a function over the decision logs, not a branch
inside a shared one.

Copying was rejected on drift, not on line count. The measurement matters
here: `.jscpd.json` sets a 5-line minimum and a 5% threshold, and the helpers a
copy would have produced — `highest`, the number loop, the title comparison —
are short enough and would have been reworded enough that **the duplication gate
would have passed a copy**. The gate did not force this decision; reading the
two implementations side by side did. That is the same lesson `core/ADR-0006`
recorded about the slug rules, arriving a second time.

### Consequences

- Good, because a rule about log numbering is written once and holds for both
  logs. Adding an eighth artifact with a numbered log is a third value, not a
  third copy.
- Good, because the reference prefix, the folder name, and the artifact noun are
  data. A message about "decision numbers" and one about "debt record numbers"
  cannot disagree about the rule they describe.
- Bad, and this is the cost to know: **the two logs' wording now moves
  together.** A message reworded for one is reworded for both, and the first
  instance shipped with this change — the gap message ended
  `and an ADR is never deleted`, which reads as `an TDR` for the other kind, so
  the whole tail became `and a decision is never deleted`. That is a
  user-visible message change forced by an artifact that has nothing to do with
  decisions.
- Bad, because every shared message now has to be read twice, once as each kind,
  and nothing enforces that. `a debt record log holds .md files and nothing
  else` is grammatical and slightly odd, and only a reader catches that class of
  thing.
- Bad, because `LogKind<T>` is a descriptor: a reader following a message from
  the terminal to the source lands on a template string assembled from a field
  in another file, instead of the sentence they saw. Straight-line code is
  cheaper to read (`CONTRIBUTING.md`), and this is the trade taken against it.
- Neutral, because the duplication gate would not have caught the copy. It stays
  useful for what it is, and it is not the reason this repo has one
  implementation.

### Confirmation

The broken-book catalogue carries the same numbering and filename rules for both
logs — `debt-number-gap`, `debt-number-repeated`, `debt-number-missing`,
`debt-filename-does-not-match-title` beside the decision books they mirror —
each asserting one exact line. A message that stops reading as English for one
kind fails there in that kind's own words.

Those four cover the book-level log, and covering only that was not enough: a
debt log sits inside every domain too, and mutation testing found three
mutations that switched every check off for a domain's own debt records with the
suite still green. `domain-debt-number-gap`,
`domain-debt-filename-does-not-match-title` and `domain-debt-decision-not-found`
are what closes that, and they are what makes the claim above true rather than
true of one carrier. One machine serving two logs is only worth its cost if both
places each log is written are held to it.

## More Information

The choice stands: one descriptor still serves both logs, and `log.ts` is
unchanged. What is retired is the record. `ADR-0014` set the bar, and this is
internal structure the next refactor could undo without costing anyone anything
— the code is its own record.
