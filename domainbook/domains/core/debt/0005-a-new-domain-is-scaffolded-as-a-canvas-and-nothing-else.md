---
status: open
date: 2026-08-01
severity: low
quadrant: deliberate-prudent
code:
  - packages/cli/src/new.ts
decisions: [format/ADR-0003]
---

# A new domain is scaffolded as a canvas and nothing else

## Debt

`domainbook new domain <id>` writes `index.md` and stops. A domain has a
glossary, a changelog, features, decisions and debt records in the format, and
none of them exists until somebody knows to create the file by hand and knows
what shape it takes.

This was a deliberate choice, taken while the answer was genuinely open —
`scaffold-a-book.md` still carries the question it was left as, "is an empty
artifact worse than a missing one?". The answer arrived from use rather than
from argument: it is worse to be missing, as long as what is written teaches the
reader how to fill it in.

## Impact

The reader who pays is the one who has just run `new domain` and does not yet
know the format. Nothing tells them a context can have its own vocabulary, so
the glossary is the artifact most often absent — which is the one the rest of
the book leans on hardest. Every domain in domainbook's own book is missing one,
four phases in, by the people who wrote the format.

It has already produced one live fault. Until this branch, `domainbook
instructions` wrote "look the domain's terms up in
`<book>/domains/<id>/glossary.md`" for every domain that claims code, whether or
not that file existed — five domains in this repo, five dead pointers, on the
surface whose whole job is steering agents. That is fixed by naming
`explain_terms` instead and mentioning a glossary only when there is one, so the
cost of this record is now the missing prompt rather than a broken instruction.

## Remedy

`domainbook new domain` writes `glossary.md`, `changelog.md`, and `features/`,
`decisions/` and `debt/` alongside `index.md`. Each carries an instructive
placeholder: the fields it takes, the values each field accepts, and a sentence
saying what belongs there — enough that the first agent to open one can fill it
in without reading a schema.

Two constraints are already known. An empty `changelog.md` and empty log folders
validate today; an empty `glossary.md` does not, because `glossarySchema`
requires at least one term. So the scaffolded glossary carries a term, which
`validate` counts and `explain_terms` can return — the placeholder has to read
unmistakably as a template, and that cost is accepted rather than designed
around. Relaxing the schema to allow a glossary with no terms was the
alternative; it changes a published format and was not taken.

The scenarios belong in `scaffold-a-book.md` with the code that satisfies them,
not in a feature of their own: this is one command's output, and splitting it
across two files would leave neither describing what `new domain` does.
