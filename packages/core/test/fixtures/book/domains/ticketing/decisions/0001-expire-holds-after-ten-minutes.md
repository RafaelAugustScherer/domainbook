---
status: accepted
date: 2026-04-18
decision-makers: [ada]
---

# Expire holds after ten minutes

## Context and Problem Statement

A fan needs long enough to pay without the seats moving under them, and a
sold-out event needs those seats back quickly when the fan walks away. The first
season used a per-venue duration, which nobody tuned and support could not
explain to a fan on the phone.

## Considered Options

- Ten minutes for every event.
- Per-venue duration, set by venue staff.
- Duration that shrinks as an event sells out.

## Decision Outcome

Chosen option: "Ten minutes for every event", because one number is the only
version support can explain, and no venue used the setting to mean anything
other than "the default".

### Consequences

- Good, because a fan is told the same rule everywhere.
- Good, because expiry is a plain comparison against the hold's timestamp.
- Bad, because a slow payment method on a sold-out event will lose seats that a
  longer window would have kept.

### Confirmation

The feature `hold-seats-during-checkout` carries the expiry rule as an example,
and the per-venue setting is removed from the seat map import.
