---
status: paid
date: 2026-05-22
severity: critical
quadrant: inadvertent-reckless
code:
  - src/ticketing/payments/**
---

# The payment gateway client has no timeout

## Debt

The HTTP client that captures a payment was written without a timeout, so a
gateway that stops answering holds the checkout request open until the load
balancer cuts it.

## Impact

One slow gateway takes the whole checkout pool with it, and the fan sees a blank
page rather than a failed payment they can retry.

## Remedy

Set a timeout below the hold window and turn the expiry into a failed capture
the fan can act on.
