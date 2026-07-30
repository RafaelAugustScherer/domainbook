---
status: accepted
date: 2026-05-20
severity: medium
quadrant: prudent-deliberate
owners: [ada]
---

# Refunds for late captures are pushed by hand

## Debt

Nothing calls the payment provider's refund endpoint; support raises each refund
in the provider's dashboard from a daily report.

## Impact

A fan waits until the next working day for money they should never have been
charged, and the report is only as good as whoever reads it.

## Remedy

Call the refund endpoint from the capture path, and keep the report as a check
on it rather than as the way it happens.
