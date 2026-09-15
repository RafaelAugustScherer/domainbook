---
status: open
date: 2026-07-30
severity: low
quadrant: inadvertent-prudent
code:
  - packages/core/src/load.ts
  - packages/core/src/load/artifact.ts
  - packages/core/test/load.test.ts
decisions: [core/ADR-0003]
---

# Two loader messages name the fault without the fix

## Debt

Handed a book root that is a file, `load.ts` answers `a book root is a folder,
and this path is a file`. It names the fault and stops there. `core/ADR-0003`
fixed the house shape as the fault and the fix in one sentence, and everything
around this line keeps it: the sibling branch seven lines above answers a missing
root with `no book here — run "domainbook init <root>" to write one`, and the CLI
answers the identical condition with `"notes.md" is a file — a book root is a
folder; pass one that is empty, or one that does not exist yet`, a wording
already written down as a scenario in
`domains/core/features/scaffold-a-book.md`. It is also the only message in the
loader that is not a template literal, which is the shape of a line written in
passing.

`load/artifact.ts` has the same gap in its YAML fallback:
`this file could not be read — ${String(thrown)}`, against its twin in
`load/disk.ts`, which ends `make it readable and run again`. It fires only when a
frontmatter read throws something that is not a `YAMLParseError`, so its reach is
small — but it is one rule, so it is one record.

## Impact

A person who points `validate` at the wrong path is told what is wrong and left
to work out what to do. That is a plausible mistake rather than an exotic one —
`domainbook validate README.md`, or a root argument that names the roadmap
instead of the folder holding it — and the shortest path from the message to a
working command is a guess.

It costs more when the reader is an agent, which the context's own canvas assumes
is as often the case as not. An agent handed a fault with no remedy either
guesses at the fix or stops to ask, and both are the outcome `core/ADR-0003`
exists to prevent. One terse message also teaches that the shape is optional,
which is how the second one came to be written.

The reach is one condition and one line, so the severity is low and the fix is
cheap. What makes it worth recording rather than shrugging at is that the
compliant wording already exists twice in this repo — in the CLI and in the
feature file — so the debt is not that nobody knows the answer.

## Remedy

Give both messages a fix clause in the house shape. The loader's borrows the
CLI's, which is the wording the scenario in `scaffold-a-book.md` already records:
name a folder that is empty or does not exist yet. The one in `load/artifact.ts`
borrows from `load/disk.ts` beside it, which already ends by telling the reader
to make the file readable and run again.

`packages/core/test/load.test.ts` pins the current sentence, so repaying this
means editing the assertion along with the message — the change is not done until
the test says the new sentence. The two loader messages and the CLI's refusal
then say one thing about one condition, which is what `core/ADR-0003` asked for
and what `TDR-0003` is about not letting drift again.
