---
status: open
severity: high
quadrant: inadvertent-prudent
owners: [ada]
---

# Hold expiry runs on a one-minute sweep

## Debt

Holds are released by a job that walks the table once a minute, because the
scheduler the design called for was not ready when checkout shipped.

## Impact

A fan can pay up to fifty-nine seconds after their hold expired and still be
refunded, and the sweep takes longer with every event we sell.

## Remedy

Move expiry onto the scheduler, one timer per hold, and delete the sweep.
