---
status: repaid
date: 2026-05-19
severity: critical
quadrant: deliberate-reckless
owners: [ada, kwame]
decisions: [ticketing/ADR-0003]
---

# Late-capture refunds are reconciled by hand each morning

## Debt

When a payment landed after the hold expired, the money was taken and no ticket
was issued. Nobody wrote the refund path; support pulled the overnight captures
into a spreadsheet each morning and refunded them one at a time from the payment
provider's dashboard.

## Impact

A fan who paid for seats they never got waited a day for the money back, and
only if someone opened the spreadsheet. Two mornings were missed over a bank
holiday, and both fans found out from their bank statement rather than from us.

## Remedy

Repaid: `ticketing/ADR-0003` made the refund automatic on the capture that
arrives late, and the morning spreadsheet is gone. What remains is the weekly
count on the canvas, which is now a metric rather than a queue of work.
