---
status: accepted
date: 2026-10-24
decision-makers: [RafaelAugustScherer]
---

# Owe no changelog entry

## Context and Problem Statement

`enforcement/ADR-0003` said a change owes a changelog entry only when its
behaviour is visible to a user, and that a changelog edit clears the check for
its domain — or, at the book root, for every domain. `ADR-0017` drops the
changelog from the book. The question is what clears the check now, and what a
user-visible change owes instead.

## Considered Options

- A user-visible change is documented in the feature that covers it, and a book
  changelog clears nothing.
- Keep counting a staged `changelog.md` as clearing its domain until books have
  run `validate --fix`.

## Decision Outcome

Chosen option: **document a user-visible change in its feature, and let no
changelog clear the check.** Any other file under a domain's folder still clears
it; a change across several domains clears with a decision at the book root, or
with an edit in each domain's book. A staged book `changelog.md` clears nothing
and is named with the same message `validate` gives.

Counting a changelog until books are cleaned was rejected: it would let a commit
pass on a file the very next `validate` refuses.

### Consequences

- Good, because what clears the check is only what the book can hold.
- Bad, because the lightest record for a cross-domain change — one root
  changelog line — is gone; it now takes a decision, an edit per domain, or a
  waiver.

### Confirmation

A staged `domainbook/changelog.md` beside code in two domains leaves both stale;
a staged root decision clears both. The block message names the canvas, the
glossary, a feature, a decision, and a debt record.

## More Information

Supersedes `enforcement/ADR-0003`. The book-wide decision is `ADR-0017`.
