---
status: open
date: 2026-04-27
severity: low
quadrant: deliberate-prudent
code:
  - src/ticketing/holds/**
decisions: [ticketing/ADR-0001]
---

# Hold expiry is checked only when a hold is read

## Debt

A hold expires ten minutes after it is placed, but nothing expires it. The
timestamp is compared when someone reads the hold, so a hold on seats nobody
looks at again stays in the table as if it were live.

## Impact

The seat map shows the seats as held until the next read, which for a quiet
event can be hours. Counting "holds that expire without payment" means scanning
the table and applying the rule again, so the metric on the canvas is computed
twice in two places.

## Remedy

A sweep releases expired holds on a timer and writes the release as an event, so
the seat map and the metric both read one answer. The read-time comparison stays
as the guard against a late sweep.
