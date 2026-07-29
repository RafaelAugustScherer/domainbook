---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Migrate repos through an interview

## Context and Problem Statement

Adoption means going from a repo with no book to a repo with a book that is
worth enforcing. Almost everything the book needs — where the boundaries are,
which word the team actually uses, why a decision was made — is not in the code.
A migration that guesses those produces a book that validates and misleads, which
is worse than no book, because enforcement will then defend it.

## Decision Drivers

- Boundaries and ubiquitous language are agreements between people, recoverable
  from code only as a guess.
- A wrong `code:` glob makes enforcement block the wrong changes and miss the
  right ones.
- The CLI is tested code; anything it generates has to be defensible without a
  person in the loop.

## Considered Options

- The CLI infers the book from the codebase by static analysis.
- An agent skill interviews the maintainer, drafts the book, and validates it;
  the CLI only scaffolds and validates.
- Templates only: the CLI writes empty files and the team fills them in.

## Decision Outcome

Chosen option: "An agent skill interviews the maintainer". Inference produces
confident wrong boundaries; empty templates produce empty books. An interview
puts the guess in front of the person who can correct it, and leaves the CLI with
only the parts that are the same in every repo.

Existing documentation is input to that interview: READMEs, docs trees, and
existing ADR folders are read and proposed, not imported silently.

### Consequences

- Good, because the boundaries and the language come from the people who hold
  them.
- Good, because the CLI stays small and testable — scaffold and validate, no
  heuristics to maintain.
- Bad, because migration quality varies with the agent and with how much time the
  interviewee gives it.
- Bad, because a repo whose maintainers are gone cannot be migrated this way at
  all; it gets a scaffold and a stranger's guesses.
- Bad, because imported MADR files that carry no frontmatter fail our narrowed
  decision schema, so the import needs a fixing step rather than a copy
  (`format/ADR-0004`).

### Confirmation

The exit test for the migration work is a real outside repo reaching a book that
`domainbook validate` passes, through the interview and not by hand-editing
around it.
