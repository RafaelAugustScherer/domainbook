---
status: open
date: 2026-06-02
severity: high
quadrant: inadvertent-prudent
decisions: [ADR-0001]
---

# Door scanners compare the door time against their own clock

## Debt

Every timestamp the book stores is UTC, but the handheld scanners at the door
compare a ticket's door time against whatever the device's own clock says, in
whatever zone the venue staff last set it to.

## Impact

A scanner an hour behind admits fans an hour early; a scanner an hour ahead
turns them away at the door with a valid ticket. Door staff have no way to see
which of the two is happening, so the first report is always a queue.

## Remedy

The scanner asks the ticketing service for the door decision instead of making
it, and falls back to its own clock only while offline — with the drift it
measured at its last sync shown on screen.
