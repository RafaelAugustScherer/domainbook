---
status: accepted
date: 2026-06-30
authored-by: agent
decision-makers: [ada, kwame]
consulted: [rosa]
---

# Refund a late capture in full

## Context and Problem Statement

Rejecting a late capture (`ticketing/ADR-0002`) only works while the gateway
still allows it. Bank transfers and some wallets settle on their own schedule,
so a capture arrives that cannot be rejected, and support was left moving money
by hand once a week.

## Decision Drivers

- A fan who paid for seats they did not get must be made whole the same day.
- Support should not be the mechanism for a case the system can see coming.

## Considered Options

- Refund every late capture in full, automatically.
- Keep rejecting where the gateway allows it and refund the rest by hand.
- Refund minus the gateway's fee.

## Decision Outcome

Chosen option: "Refund every late capture in full, automatically", because it is
the only option with one outcome for the fan regardless of how they paid, and
the fee is cheaper than the support call it replaces.

### Consequences

- Good, because a fan sees a charge and its refund instead of a silent failure.
- Good, because the rule holds for payment methods that cannot be rejected.
- Bad, because the money leaves and returns, which reads as a mistake on a
  statement even when it is the documented outcome.

### Confirmation

The feature `hold-seats-during-checkout` carries the late capture as an example,
and the refund is in the ticketing changelog for 1.2.0.

## More Information

Supersedes `ticketing/ADR-0002`, which rejected the capture instead.
