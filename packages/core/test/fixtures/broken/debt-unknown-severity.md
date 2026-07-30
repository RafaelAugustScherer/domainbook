---
status: open
date: 2026-05-18
severity: blocker
quadrant: inadvertent-prudent
code:
  - src/ticketing/seatmap/**
---

# The seat map is refetched on every keystroke

## Debt

The checkout page asks seating for the whole map each time the fan edits the
quantity field, because the first version had no quantity field to debounce.

## Impact

A busy on-sale sends seating twenty times the traffic it was sized for, and the
map flickers while the fan is choosing.

## Remedy

Fetch the map once per event and filter it in the browser.
