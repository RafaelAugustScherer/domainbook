---
status: open
date: 2026-05-29
severity: medium
quadrant: deliberate-prudent
decisions: [ticketing/ADR-2]
---

# The late-capture refund path has no test

## Debt

Refunding a capture that lands after the hold expired was shipped against a
manual check, and no test holds the behaviour down.

## Impact

The rule that decides whether a fan is charged can be changed by accident, and
the first sign of it is a fan asking where their money went.

## Remedy

Write the case as a scenario in the checkout feature and run it against a
gateway stub.
