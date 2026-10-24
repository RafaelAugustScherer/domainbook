---
status: accepted
date: 2026-07-30
decision-makers: [RafaelAugustScherer]
---

# Narrow the debt record to four fields and three sections

## Context and Problem Statement

`ADR-0013` settled that debt is the seventh artifact type, where its log lives,
and which template it derives from, and left the exact schema, the reference
grammar, and the validation rules to Phase 1.1. Three questions had to be
answered before anything could be written: which of Stal's seventeen fields a
record must carry, which it may carry, and what a reader is guaranteed to find
in the body.

A fourth question came with them, and it is the one `ADR-0013` answered on
paper: that record says debt is "referenced as `TDR-NNNN` and qualified as
`<domain-id>/TDR-NNNN` across logs, the `format/ADR-0005` rule applied
unchanged". A reference form is only real if something resolves it.

## Decision Drivers

- `severity` and `quadrant` are the whole reason the log can be queried. Without
  them a debt log is a folder of prose, and "what open debt touches this code"
  degrades to reading every file.
- Traceability is what separates a record from an opinion (`ADR-0013`), but debt
  found before there is code to point at — a missing capability, a decision not
  yet taken — is still worth writing down.
- A required field a writer cannot answer honestly gets a placeholder, and a
  placeholder in a required field is worse than an absent optional one.
- `validate` speaks in one voice, and messages about a closed set of values are
  already written once for the whole book (`core/ADR-0003`).

## Considered Options

- Four required fields — `status`, `date`, `severity`, `quadrant` — three
  optional — `owners`, `code`, `decisions` — and a body of exactly Debt, Impact,
  Remedy.
- The same, plus `code` required, so every record traces to something.
- Only `status` and `date` required, mirroring the decision schema field for
  field, with severity and quadrant left to prose.

## Decision Outcome

Chosen option: "four required, three optional".

```yaml
---
status: open                   # open | accepted | repaid
date: 2026-07-30               # when the debt was recorded, as YYYY-MM-DD
severity: high                 # low | medium | high | critical
quadrant: deliberate-prudent   # deliberate-prudent | deliberate-reckless |
                               #   inadvertent-prudent | inadvertent-reckless
owners: [ada]                  # optional
code:                          # optional
  - src/ticketing/holds/**
decisions: [ticketing/ADR-0001]   # optional
---
```

The body is an H1 title, then exactly three H2s in this order, all required:
`Debt` — the shortcut or gap, concretely; `Impact` — what it costs and when it
bites; `Remedy` — what repayment looks like. A record with no H1 is told that
and nothing else, the same way a decision is (`format/ADR-0015`): with no title
there is nothing for the filename to be checked against.

`code` required was rejected because the first record it would have blocked is
one this book needed to write — debt whose remedy is code that does not exist
yet has no glob to name. Mirroring the decision schema was rejected because it
gives up the only two fields that make a log answerable without reading it: the
site's severity badges, the staged check's triage, and MCP's scoped index all
read `severity` and `quadrant`, and none of them can read prose.

**The enums carry no custom `error:`, on purpose.** `messageOf` in
`packages/core/src/issue.ts` already turns zod's "Invalid option" into
`must be one of "low", "medium", "high", "critical"` — the values themselves,
listed from the schema. A hand-written message would say the same thing in
worse words and would go stale the day a value is added. `date` keeps its
`error:` because the renderer has nothing better than zod's default to say
about an ISO date, and the decision log's `status` keeps its own because it is
a union of an enum and a pattern, where a generated message can only describe
one arm. A reviewer who reads `z.enum([...])` here and reaches for a message is
undoing this.

**Nothing resolves a `TDR-NNNN` reference.** `TDR` ships as a display prefix in
`validate`'s messages and nowhere else: there is no `debtRef` beside
`decisionRef` in `packages/core/src/schemas/common.ts`, and no artifact gained a
`debt:` field. `ADR-0013`'s sentence about references across logs describes an
intent, not what is on disk. It stays unbuilt because no consumer needs it yet —
debt points outward at decisions and at code, and nothing has asked to point at
debt. The grammar is the decision log's when it is built (`format/ADR-0005`),
and building it is a new decision, not an omission to quietly fill in.

### Consequences

- Good, because every record answers "how bad" and "how did this happen" in
  fields, so the register can be sorted, filtered, and badged without a reader.
- Good, because a debt found in a review can be written the moment it is found:
  four fields a person already knows, and the tracing fields when there is
  something true to put in them.
- Good, because the value lists in messages are generated from the schema, so
  adding a severity level changes one line and every message that names the
  levels follows.
- Bad, because `severity` and `quadrant` are judgments with no scale behind
  them. Two people classify the same shortcut differently, and nothing in the
  format can tell them apart from a scale that means something.
- Bad, because `code` being optional means a book can accumulate debt that
  traces to nothing — exactly the opinion-not-a-record failure `ADR-0013`
  warned about — and only a reader will notice.
- Bad, because the generator writes `severity: medium` and
  `quadrant: deliberate-prudent` as placeholders, which is the required-field
  problem arriving by the back door. The comment on the line says so, and
  nothing checks that anyone read it.
- Bad, because `ADR-0013` claims a reference form this record leaves unbuilt.
  Anyone reading the two in order finds the gap named here rather than in a
  message, which is the best that can be done short of writing the reference
  nobody needs.

### Confirmation

The golden fixture book carries four debt records — two logs, every optional
field used at least once, and more than one value of each enum. One broken book
per body rule (`debt-section-missing`, `debt-unknown-section`,
`debt-section-repeated`, `debt-sections-out-of-order`, `debt-without-title`) and
one broken file per frontmatter rule under `test/fixtures/broken/debt-*.md`,
each asserted to produce exactly one message. The absence of a `TDR` reference
is confirmed by its absence: no schema names one, so no fixture can.
