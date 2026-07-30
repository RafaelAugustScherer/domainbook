---
status: open
date: 2026-04-27
severity: low
quadrant: deliberate-prudent
---

# Door scanners trust their own clock

## Debt

The handheld scanners at the door compare a ticket's door time against the
device's own clock rather than asking the ticketing service.

## Impact

A scanner an hour behind admits fans early; a scanner an hour ahead turns them
away with a valid ticket, and door staff cannot tell which is happening.

## Remedy

The scanner asks ticketing for the door decision and falls back to its own
clock only while offline.
