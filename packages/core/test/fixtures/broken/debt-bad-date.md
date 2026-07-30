---
status: open
date: 11-05-2026
severity: low
quadrant: deliberate-prudent
---

# Hold identifiers are sequential

## Debt

A hold is identified by an auto-incrementing column, so one fan's identifier
tells them roughly how many holds were placed before theirs.

## Impact

Nothing is exposed that a fan should not see, but the number leaks sales volume
to anyone who places two holds and subtracts.

## Remedy

Issue a random identifier for the fan-facing hold and keep the column for
ordering inside the database.
