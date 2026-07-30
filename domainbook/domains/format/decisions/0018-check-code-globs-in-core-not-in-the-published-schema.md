---
status: accepted
date: 2026-07-30
decision-makers: [RafaelAugustScherer]
---

# Check code globs in core, not in the published schema

## Context and Problem Statement

`code:` is a list of globs that maps repo paths to a book artifact. Until
Phase 1.1 nothing checked what was in that list beyond "a non-empty string", so
`/src/billing/**`, `src\billing\**` and `src//billing/**` were all accepted and
all matched nothing. Phase 1.1 gave `code:` a second home — a debt record traces
to the code that carries it — and the roadmap named glob syntax as a deliverable.

Where the check lives is the question, because `code:` is in the published JSON
Schema and a `pattern` there would be enforced by every editor. `format/ADR-0002`
already answered the same question once for cross-field rules; this one is
different, because a regex *can* express it.

## Decision Drivers

- A glob that matches nothing fails silently. The enforcement loop maps changed
  paths to a domain, so a wrong glob does not error — it just never fires, and a
  book looks enforced while nothing is.
- Every message says what is wrong **and what to do**, in one sentence
  (`CONTRIBUTING.md`). A regex can only say no.
- `code:` on a domain page and `code:` on a debt record are one field with one
  meaning. A rule that applied to one and not the other is drift by construction.
- An editor is a weaker check than `validate` and always will be
  (`format/ADR-0002`); anything only the editor knows is a rule half the writers
  never see.

## Considered Options

- Check the syntax in core, over both `domain.code` and `debt.code`, with a named
  fix per fault.
- Put a `pattern` on the string in `schemas/common.ts`, so the rule publishes to
  JSON Schema and editors reject the value as it is typed.
- Pull in a glob library and let it decide what parses.

## Decision Outcome

Chosen option: "check in core, over both". `packages/core/src/check/glob.ts`
rejects six kinds of fault in nine messages, each naming the character at fault
and the pattern to write instead:

- a pattern naming nothing (`"/"`, or anything else that is only separators and
  whitespace) — "names no path"
- a backslash separator (`src\ticketing\**`) — a pasted Windows path, answered
  with the same pattern in forward slashes
- an absolute path (`/src/ticketing/**`) — answered with the leading slash gone
- a segment that climbs out of the repo (`../shared/**`)
- an empty segment (`src//ticketing/**`) — answered with the extra slash gone
- an unclosed `{` or `[`, and a `}` or `]` that nothing opened — four messages,
  because the fix differs each way round

`""` is not on that list, and this is the layering rather than an omission. The
schema is `z.array(z.string().min(1))`, so an empty string fails the parse, the
frontmatter is never built, and this check never sees the record. The writer
gets `code[0]: is empty — write a value, or remove it` from the schema layer.
`"/"` parses fine and is caught here. An accepted record that claimed a rule the
layer above already enforces would be exactly the drift this book exists to
prevent, so the two are named separately.

A backslash before `[ ] { } * ? \` escapes that character; an escaped bracket
does not count toward the balance check. **A backslash before anything else is a
Windows separator, and one of those condemns the whole pattern** — every
backslash in it is then read as `/`, escapes included.

The escape half is not decoration. `\` is the standard glob escape and the only
way to name a literal `[`, so a Next.js `app/[locale]/**` route folder could not
be written at all: escaped it was refused as a Windows path, since every
backslash was a separator and the suggested rewrite turned the escapes into
slashes, and unescaped it is still a character class matching one letter out of
`locale` rather than that folder. `app/\[locale\]/**` is now accepted. The Windows half is why the rule is
not simply "a backslash escapes the next character": `src\ticketing\**` — this
ADR's own pasted-path example — ends in `\*`, which that simpler rule reads as
an escaped asterisk, and the example stops working.

One property holds over the whole check, and it is the point of the second half
of every message: **a pattern the check suggests passes the check.** Two faults
cannot be fixed by rewriting the pattern — `..` and an unbalanced bracket — so
they are tested first and answered with prose. Everything after them is answered
with a pattern that is fully corrected rather than corrected for the one fault
that fired: `\src\billing\**` gives `src/billing/**`, not the `/src/billing/**`
that would then fail the absolute-path rule, and `/src//x/**` gives `src/x/**`,
not the `src//x/**` that would then fail the empty-segment rule. `..\shared\**`
and `/../shared/**` report climbing above the repo rather than a separator or a
root fault, because that is the fault a rewrite cannot repair.

The schema keeps `z.array(z.string().min(1)).min(1).optional()`. A `pattern`
was rejected because the whole value of this check is the second half of the
sentence: `"src\ticketing\**" separates folders with "\" — a code path uses "/",
so write "src/ticketing/**"` is a fix a writer can paste, and JSON Schema's
answer to a failed pattern is that the pattern failed. A glob library was
rejected on the CLI's no-dependency rule (`core/ADR-0001`) and because a library
answers "does this parse", which is not the question — `../shared/**` parses
fine and is still wrong here.

The check runs over domain pages and debt records from one list, so the two
fields cannot diverge. That makes it a rule domain pages gained without asking:
a book that validated yesterday with `code: [/src/billing/**]` fails today.
That is the point — the glob was never matching anything — but it is a break,
and the changelog says so.

### Consequences

- Good, because a glob that could never match is caught where it is written
  rather than by the silence of an enforcement check that never fires.
- Good, because a message that names a pattern names one the check accepts, so
  the fix is a paste rather than a paste followed by a second refusal.
- Good, because one implementation serves both artifacts, and a seventh fault
  added later applies to both by construction.
- Bad, because this is a rule that exists only in the CLI, and the count of
  those is a metric the format context watches. An editor pointed at
  `debt.schema.json` accepts `/src/**` without a word.
- Bad, because a book that passed can now fail on a page nobody touched. The
  break is small and the fix is mechanical, but it is a break in a tool whose
  own promise is that `validate` is stable.
- Bad, because syntax is all this checks. A perfectly formed glob that matches
  no file in the repo is still accepted, and that is the more common mistake —
  catching it means reading the repo, which the loader does not do.

### Confirmation

Five broken books, each asserting exactly one line — three filed on a domain
page and two on a debt record, so both carriers of the field are exercised — and
unit tests in `check.test.ts` for the four faults a whole book adds nothing to.
The absolute-path and backslash books assert the corrected pattern in the
message text, which is the part that would rot first.

The paste property has a test of its own rather than an example: `check.test.ts`
takes the pattern out of every message that offers one and feeds it back in,
asserting no issue comes out. A message that starts suggesting an unusable
pattern fails there without anyone having thought of that pattern first.
