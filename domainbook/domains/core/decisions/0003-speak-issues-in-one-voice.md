---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Speak issues in one voice

## Context and Problem Statement

Four different things find fault with a book: the loader (a file the format does
not know, YAML that does not parse), zod (a key that is not a field, a value
that is not in the set), the body checkers (a canvas section out of order), and
the reference checks (a decision that does not exist). Left alone, each reports
in its own shape and its own words — zod says "Invalid option: expected one of",
the loader says whatever the exception said — and `domainbook validate` reads
like four tools sharing a terminal.

The output is the product. It is what a person sees first and it is the whole
interface for an agent, which cannot ask a follow-up question.

## Decision Drivers

- An agent has to act on a line without opening the file, so the line has to
  carry where, what, and what to do.
- The same book validated twice has to print the same lines in the same order,
  or the output cannot be diffed or tested.
- Numbers and paths in a message are the parts people copy, so they have to be
  right for the place they are pasted.

## Considered Options

- One issue record with one renderer, plus rules for what a message may say.
- Let each layer print its own line in whatever shape suits it.
- Pass zod's messages through unchanged and write our own only for the rest.

## Decision Outcome

Chosen option: "One record, one renderer". An issue is a file, an optional line,
an optional field, and a message; `formatIssue` renders `file:line field:
message` and `sortIssues` orders by file, then line, then field. zod's messages
are rewritten where they help nobody — a missing key reads "is required", an
unlisted value lists the values that exist.

Four rules decide what goes in one:

- `file` is relative to the working directory the command ran in, so the line
  pastes into an editor and terminals that linkify `path:line` do the right
  thing.
- Paths inside the message text are relative to the book root, because there the
  message is talking about the book and the reader is reading the book:
  `domains/ticketing/decisions/ holds ADR-0001 and ADR-0002`.
- One mistake gets one message. Frontmatter that opens a fence and declares
  nothing reports once — not once per required key — which is
  `format/ADR-0012`'s distinction made concrete.
- A contradiction between two pages is filed on the first page that declares it
  and names the other. Either side may hold a declaration (`format/ADR-0006`),
  so filing it on both would report one mistake twice.

### Consequences

- Good, because every failure reads the same way, and an agent can fix from the
  line without opening the file.
- Good, because the output is sorted and deterministic, so it can be asserted
  whole in a test and diffed between runs.
- Bad, and this is the sharpest edge: two path conventions live in one line. Run
  from the repo root with the book at `domainbook/` and the two look identical,
  so the rule is easy to break without anyone noticing until someone runs the
  command from somewhere else.
- Bad, because filing a contradiction on the first page in book order puts the
  message on a page whose author may not have written the mistake, and the fix
  is as likely to be in the file the message names.
- Bad, because one message per mistake means fixing one can uncover several: the
  empty frontmatter reports once, and the next run reports every key it was
  hiding. A noisier tool would have printed them together.
- Bad, because "name the file, the field, and the fix" is a rule for whoever
  writes the message. The type holds the first two; nothing holds the third.

### Confirmation

Every broken book asserts exactly one line, so one-mistake-one-message is a test
rather than a habit. The CLI asserts the whole sorted output of a book with two
issues in two files, which is where the ordering rule would break first.
