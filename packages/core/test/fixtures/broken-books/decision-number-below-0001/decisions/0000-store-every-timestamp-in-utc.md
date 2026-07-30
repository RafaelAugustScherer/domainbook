---
status: accepted
date: 2026-02-11
decision-makers: [ada, kwame]
---

# Store every timestamp in UTC

## Context and Problem Statement

Holds expire, doors open, and seasons roll over across venues in different time
zones. Storing local times made two bugs in the first season.

## Considered Options

- Store UTC everywhere, convert at the edge.
- Store local time with an offset column.

## Decision Outcome

Chosen option: "Store UTC everywhere, convert at the edge", because it is the
only option where two timestamps compare without loading venue data.

### Consequences

- Good, because expiry and ordering are plain comparisons.
- Bad, because every screen and export has to convert, and a missed conversion
  shows a fan the wrong door time.
