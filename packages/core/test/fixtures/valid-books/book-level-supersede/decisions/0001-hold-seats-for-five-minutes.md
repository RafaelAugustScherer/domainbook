---
status: superseded by ADR-0002
date: 2026-03-09
decision-makers: [ada]
---

# Hold seats for five minutes

## Context and Problem Statement

A fan who picks seats needs them kept while the payment form is filled in, and
a sold-out event needs abandoned seats back before the queue gives up.

## Considered Options

- Five minutes for every event.
- Hold until the fan closes the tab.

## Decision Outcome

Chosen option: "Five minutes for every event", because it is the shortest window
the first season's payment provider ever needed.

### Consequences

- Good, because abandoned seats come back while fans are still queueing.
- Bad, because a fan paying by bank transfer loses the seats mid-payment.
