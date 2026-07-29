---
status: accepted
date: 2026-03-09
decision-makers: [ada]
---

# Keep the clock on the server

## Context and Problem Statement

A hold expires against a clock, and a browser's clock is whatever the fan's
laptop says it is.

## Decision Drivers

- Two fans looking at the same seats must see the same expiry.
- Nothing a fan controls may extend a hold.

## Considered Options

- Compare against the server clock on every request.
- Trust the timestamp the browser sends.

## Decision Outcome

Chosen option: "Compare against the server clock on every request", because a
hold a fan can extend by changing their laptop clock is not a hold.

### Consequences

- Good, because expiry is the same for every fan.
- Bad, because the countdown a fan sees can drift from the one that decides.
