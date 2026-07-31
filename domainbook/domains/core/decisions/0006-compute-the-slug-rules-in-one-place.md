---
status: deprecated
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Compute the slug rules in one place

## Context and Problem Statement

`format/ADR-0016` gave slugs three mechanical rules: a slug is in Unicode NFC,
it equals its own NFKC form, and it holds at most 247 bytes as UTF-8. Two
implementations enforced them — one in core's `check.ts` for `validate`, one in
the CLI's `new.ts` for the generators — each with its own normalize-and-diff
helpers, its own code-point printer, and its own copy of the 247 constant.

Two copies of one rule can drift, and drift here breaks the generators'
central promise: `new` and `validate` would each have their own idea of
whether an id is legal, so a page one accepts the other could reject. The
duplication gate (`ADR-0010`) never saw the copies, because jscpd matches
text and the two messages were worded differently around the same
arithmetic. The copies surfaced only when the tree was read against
`CONTRIBUTING.md` (`ADR-0012`), which says packages talk through
`src/index.ts` in plain data types.

## Decision Drivers

- `new` and `validate` must agree about the same id, always — the generators
  write only what validates.
- Message wording is the renderer's job (`core/ADR-0003`): `validate` speaks
  in issues about a file that exists, the generator in refusals before
  anything is written. The two registers are different on purpose.
- A shared helper should cross the package boundary as plain data
  (`CONTRIBUTING.md`), not as prose one caller then has to take apart.

## Considered Options

- One module in core exporting the facts as plain data, each caller wording
  its own message.
- One module exporting finished message strings for both callers.
- Keep both copies and add a test binding them together.

## Decision Outcome

Chosen option: "One module exporting the facts as plain data".
`packages/core/src/unicode.ts`, exported through core's `index.ts`, holds the
three rules once: `divergence(value, "NFC" | "NFKC")` answers with the
normalized form, the first character where the two part, and the code points
held and wanted as `U+XXXX` strings — or nothing when the value is already in
form; `overlong(value)` answers with the UTF-8 byte count only when it
exceeds the limit; `slugBytes` is the 247 itself. `check.ts` and the CLI's
`new.ts` both consume these and keep their own sentences around them. No
user-visible message changed.

Shared message strings were rejected because the two callers do not say the
same thing: "write the NFC form" about a file already on disk and "write this
instead" about a title not yet written are different speech acts, and one
string serves both only by flattening the voice `core/ADR-0003` fixed. A test
binding two copies was rejected because it proves agreement on the cases
someone thought to list; one implementation makes disagreement impossible on
all of them.

### Consequences

- Good, because `new` and `validate` can no longer disagree about an id:
  there is one answer to whether a slug is in form and in budget, and both
  read it.
- Good, because the facts sit on core's public surface as plain data, so
  enforcement, the MCP server, or the site can apply the same rules without
  growing a copy of their own.
- Bad, because core's public surface grows by three names that were an
  internal helper yesterday, and a published export is held stable in a way a
  private function never is.
- Bad, because only the arithmetic is unified. The two messages about the
  same fault are still written in two files, and their prose can drift where
  the numbers now cannot.
- Neutral, because the gate that exists for duplication did not find this and
  will not find the next one worded differently. Copies that share meaning
  but not text are caught by reading, not by jscpd.

### Confirmation

The slug tests in core and the CLI's misuse tests feed off-form ids — decomposed
NFC cases, fullwidth NFKC folds, over-247-byte names — through `validate` and
through `new` respectively, so both callers are exercised against the same rule
set they now share.

## More Information

The choice stands: the slug rules still live in one module and both callers
still read them from there. What is retired is the record. `ADR-0014` set the
bar, and this is internal structure the next refactor could undo without
costing anyone anything — the code is its own record.
