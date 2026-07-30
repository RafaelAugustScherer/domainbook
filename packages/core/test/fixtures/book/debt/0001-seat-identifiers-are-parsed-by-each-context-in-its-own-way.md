---
status: accepted
date: 2026-05-11
severity: medium
quadrant: inadvertent-reckless
owners: [ada]
code:
  - src/seating/**
  - src/ticketing/**
---

# Seat identifiers are parsed by each context in its own way

## Debt

Seating publishes a seat identifier as `<block>-<row>-<number>`, and every
context that reads it splits the string itself. Ticketing splits on the last two
hyphens, access-control splits on the first two, and neither knows the other
exists.

## Impact

A block name with a hyphen in it — "Upper-East" at the second venue — reads as a
different seat in each context, so a ticket scans for a seat nobody sold. The
two parsers have already drifted once, and the next venue with a hyphenated
block name will find it again.

## Remedy

Seating publishes the identifier's parts alongside the string it composes, and
the other two contexts read the parts instead of splitting. The composed string
stays for display and for the printed ticket.
