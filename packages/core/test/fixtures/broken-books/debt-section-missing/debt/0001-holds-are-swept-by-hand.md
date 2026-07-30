---
status: open
date: 2026-04-27
severity: low
quadrant: deliberate-prudent
---

# Holds are swept by hand

## Debt

A hold expires ten minutes after it is placed, but nothing expires it.
Support runs a query each morning and releases the holds it finds.

## Impact

Seats sit unsellable overnight on every event nobody looked at, and the
morning query is the only thing standing between a fan and a sold-out screen.
