---
status: deprecated
date: 2025-11-02
decision-makers: [ada]
---

# Store local time with an offset

## Context and Problem Statement

The first season stored the venue's local time with the offset it was recorded
at, which two bugs later turned out to be unorderable across a clock change.

## Considered Options

- Store local time with an offset column.
- Store UTC everywhere.

## Decision Outcome

Chosen option: "Store local time with an offset column", because support reads
raw timestamps and wanted them in the venue's own clock.

### Consequences

- Good, because a support agent reads a timestamp without converting it.
- Bad, because two timestamps only compare after loading the venue.
