---
status: repaid
date: 2026-08-01
severity: low
quadrant: deliberate-prudent
code:
  - packages/cli/src/new.ts
  - packages/cli/src/init.ts
decisions: [format/ADR-0003]
---

# A new domain is scaffolded as a canvas and nothing else

## Debt

`domainbook new domain <id>` wrote `index.md` and stopped. A domain has a
glossary, a changelog, features, decisions and debt records in the format, and
none of them existed until somebody knew to create the file by hand and knew
what shape it takes.

This was a deliberate choice, taken while the answer was genuinely open —
`scaffold-a-book.md` carried the question it was left as, "is an empty artifact
worse than a missing one?". The answer arrived from use rather than from
argument: it is worse to be missing, as long as what is written teaches the
reader how to fill it in.

## Impact

The reader who paid was the one who had just run `new domain` and did not yet
know the format. Nothing told them a context can have its own vocabulary, so the
glossary was the artifact most often absent — which is the one the rest of the
book leans on hardest. Every domain in domainbook's own book is still missing
one, four phases in, by the people who wrote the format.

It produced one live fault. Until the branch that recorded this, `domainbook
instructions` wrote "look the domain's terms up in
`<book>/domains/<id>/glossary.md`" for every domain that claims code, whether or
not that file existed — five domains in this repo, five dead pointers, on the
surface whose whole job is steering agents. That was fixed by naming
`explain_terms` instead and mentioning a glossary only when there is one, which
left the cost of this record as the missing prompt rather than a broken
instruction.

## Remedy

Repaid. `domainbook new domain` writes `glossary.md` and `changelog.md`
alongside `index.md`, and `features/`, `decisions/` and `debt/` each holding a
`.gitkeep`. Each page carries an instructive placeholder: the fields it takes,
the values each field accepts, and a sentence saying what belongs there, so the
first agent to open one can fill it in without reading a schema. `init` writes
the same two files at the book root, which settles the question one level up
that this record's remedy first left open. The scenarios are in
`scaffold-a-book.md` with the code that satisfies them, not in a feature of
their own: this is one command's output, and splitting it across two files would
leave neither describing what `new domain` does.

Three costs were weighed and taken. An empty `changelog.md` and empty log
folders validate, but an empty `glossary.md` does not, because `glossarySchema`
requires at least one term — so the scaffolded glossary carries `<Term>`, which
`validate` counts and `explain_terms` returns until somebody replaces it.
Relaxing the schema to let a glossary hold no terms was the alternative; it
changes a published format and was not taken. The `.gitkeep` files are git
artifacts inside a book that is otherwise format-only, kept because git does not
track an empty folder and a folder that disappears at the first commit teaches
the person who scaffolded it and nobody who clones; the loader ignores dotfiles,
so `validate` never sees them. And a fresh book now reports one term rather than
none, because `init` writes a glossary too.
