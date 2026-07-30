---
status: accepted
date: 2026-06-30
decision-makers: [ada, kwame]
---

# Refund a late capture in full

## Context and Problem Statement

Bank transfers and some wallets settle on their own schedule, so a capture
arrives that the gateway can no longer reject, and support was left moving money
by hand once a week.

## Decision Drivers

- A fan who paid for seats they did not get must be made whole the same day.
- Support should not be the mechanism for a case the system can see coming.

## Considered Options

- Refund every late capture in full, automatically.
- Keep rejecting where the gateway allows it and refund the rest by hand.

## Decision Outcome

Chosen option: "Refund every late capture in full, automatically", because it
is the only option with one outcome for the fan regardless of how they paid.

### Consequences

- Good, because a fan sees a charge and its refund instead of a silent failure.
- Bad, because the money leaves and returns, which reads as a mistake on a
  statement even when it is the documented outcome.
