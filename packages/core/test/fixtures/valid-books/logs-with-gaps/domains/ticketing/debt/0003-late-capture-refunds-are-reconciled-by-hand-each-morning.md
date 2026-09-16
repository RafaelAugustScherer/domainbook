---
status: open
date: 2026-06-30
severity: medium
quadrant: deliberate-prudent
---

# Late capture refunds are reconciled by hand each morning

## Debt

A capture that lands after the hold expired is refunded in full, but the refund
is raised from a spreadsheet support fills in from the gateway's report.

## Impact

A fan waits a day for money the system already decided to return, and the
spreadsheet is the only record of which refunds were raised.

## Remedy

Ticketing raises the refund when it rejects the capture, and the gateway report
becomes a reconciliation check rather than the trigger.
