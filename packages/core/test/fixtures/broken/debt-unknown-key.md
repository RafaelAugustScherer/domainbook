---
status: open
date: 2026-05-26
severity: high
quadrant: deliberate-reckless
effort: three days
---

# Checkout reads the seating tables directly

## Debt

The hold path queries seating's tables instead of asking for the seat map,
because the query was written before seating had a read model to ask.

## Impact

A column rename in seating breaks checkout, and neither side finds out until an
on-sale fails.

## Remedy

Go back through `GetSeatMap` and drop checkout's grants on seating's schema.
