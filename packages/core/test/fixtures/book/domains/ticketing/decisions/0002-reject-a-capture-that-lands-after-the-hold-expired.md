---
status: superseded by ticketing/ADR-0003
date: 2026-05-04
decision-makers: [ada]
---

# Reject a capture that lands after the hold expired

## Context and Problem Statement

A payment can be captured seconds after the hold it belongs to expired and the
seats went back on sale. The seats are gone, so no ticket can be issued, and the
money has to go somewhere.

## Considered Options

- Reject the capture at the gateway.
- Take the money and refund it.
- Reinstate the hold and issue the ticket anyway.

## Decision Outcome

Chosen option: "Reject the capture at the gateway", because money that is never
taken needs no refund, and reinstating a hold would sell the same seat twice on a
sold-out event.

### Consequences

- Good, because the fan's statement never shows a charge for seats they did not
  get.
- Bad, because the gateway decides how long a rejection stays possible, and that
  window is not ours to set.

### Confirmation

The capture path checks the hold's expiry before it settles.
