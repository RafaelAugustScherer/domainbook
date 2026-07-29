---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Demand a changelog entry only for user-visible changes

## Context and Problem Statement

`domainbook check` knows a domain's book was touched. It could also insist on
*which* file: a canvas edit, a glossary term, a changelog line. The changelog is
the tempting one to require, because it is the artifact a reader outside the team
actually reads. Requiring it on every commit is also the fastest way to fill it
with noise.

## Decision Drivers

- A changelog is written for someone deciding whether a change affects them.
  Entries that do not help that decision make the ones that do harder to find.
- Most commits — a rename, a test, a refactor — change nothing a user could
  notice.
- An entry demanded per commit gets written to satisfy the check, and everyone
  can tell.

## Considered Options

- Demand a changelog entry for user-visible behaviour changes only; any book
  update satisfies the check otherwise.
- Demand one on every commit that touches mapped code.
- Never demand one; leave the changelog to release time.

## Decision Outcome

Chosen option: "User-visible behaviour changes only". The check's job is that the
book is not stale, not that a particular file was edited. Whether a change is
user-visible is a judgment the author makes; the check asks for it in the message
rather than deciding it from the diff, because a diff cannot see it.

Release-time-only was rejected for the same reason the whole loop exists: written
later, it is written by someone reconstructing the change from a diff.

### Consequences

- Good, because the changelog stays readable — every entry is there because
  something changed for someone.
- Good, because ordinary refactoring is not taxed.
- Bad, because "user-visible" is a judgment, so two authors will draw the line
  differently and neither is wrong enough to fail a check.
- Bad, because a user-visible change with an updated canvas and no changelog line
  passes; the loop cannot catch that, and only review will.

### Confirmation

The rule shows in what the check says, not only in what it does: a block on a
change that looks user-visible names the changelog among the files that would
clear it, and never demands it on its own.
