---
name: migrate-a-repo
description: Turn a repo that has no domainbook into one with a validated book, through an interview with the maintainer. Use when adopting domainbook in an existing codebase, or when someone asks to "set up the book" or "document this repo from scratch".
---

# Migrate a repo

Take a repo from no book to a book worth enforcing. The book's boundaries, words,
and decisions are agreements the code cannot reveal on its own — so this is an
interview, not a conversion. You propose; the maintainer confirms, corrects, or
rejects; only what they confirm is written as confirmed.

Do not write anything until step 6. Reading and proposing come first.

## 1. Read what is already written

Read the repo's own documentation before you ask anything: `README*`, a `docs/`
tree, and any existing ADR folder (`adr/`, `docs/decisions/`, `doc/adr/`). Name
each source in your proposal as where a claim came from. When the repo's own
documentation is thin or absent, do not fall back to the code yet — ask the
maintainer whether the documentation lives somewhere else: a path outside this
repo, a URL, an exported wiki or Notion page. Read what they point you at and
name it as a source like any other. Only when there is nothing written anywhere,
in the repo or out of it, say the proposal comes from the code alone and is
weaker for it — then still ask before writing.

## 2. Propose the boundaries, and confirm each one

From the code and the docs, propose the bounded contexts you see. Put each to the
maintainer before it exists on disk. For every proposed `code:` glob, say how many
files in this repo it matches, and name any file the maintainer called part of a
context that the glob misses. When a boundary is rejected, redraw it from their
answer and put it back to them — do not argue it. Name code that no confirmed
context claims as unclaimed; never widen a glob to cover it.

## 3. Propose the words, from the ones the repo already uses

Propose glossary terms for the words the code uses, and name where each is used.
A word the code uses two ways is a question, not a merge — ask which meaning the
term holds here. A term's status says how sure its definition is: one read from
the maintainer's own documentation — the repo's, or the one they pointed you at —
is `validated`, because that documentation is the maintainer's own words; show it
for correction, but do not wait for a second yes to write what they already
wrote. A term you guessed from the code that nobody has answered stays `draft`
until they confirm it.

## 4. Propose features for behaviour the code implies

Where tests or code imply a behaviour, propose a feature for it and name what you
read it from. A feature's status follows the same rule as a term's: behaviour you
read from the maintainer's own documentation — a scenarios file, a spec they
pointed you at — is written `ready`, because they already wrote it down; behaviour
they confirm in the interview is `ready` on their word. Nothing reads
`implemented` until a walkthrough has run, however the behaviour was sourced.
Behaviour nobody wrote and nobody confirmed is not written.

## 5. Import existing decisions

A MADR body imports unchanged — keep its Context and Problem Statement, Considered
Options, and Decision Outcome. Ask the maintainer for the `status` and the date it
was taken; if nobody remembers the date, use the date git first saw the file and
say so — never today's date. A body that does not meet the format (no Decision
Outcome, say) is fixed with the maintainer, not silently. Numbering is the book's
log, from 0001 with no gaps; each imported record names the file it came from.

## 6. Write the book with the CLI

Now write, using the tested generators — do not hand-write files:

- `domainbook init <book-root>` for the book itself.
- `domainbook new domain <id>` for each confirmed context, then fill the canvas,
  glossary, and features in.
- `domainbook new decision "<title>" [--domain <id>]` for each imported record,
  then paste its body in.

Let the generators own numbering and filenames; do not renumber a log yourself.

## 7. Validate, then write the instructions

Run `domainbook validate` and report its output. The migration is not done until
it passes — if it names issues, name them too and keep going. Once it passes, run
`domainbook instructions` so the repo carries the rule, the waiver syntax, and
these procedures.

## When there is nobody to interview

A repo whose maintainers are gone cannot be migrated this way. Write the book root
and no contexts, say a scaffold is all you could produce, and name what to run
once someone who knows the boundaries is found. Never write a guess as though it
had been confirmed.
