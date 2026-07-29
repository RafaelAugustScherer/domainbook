---
status: superseded by ADR-0002
date: 2026-04-18
decision-makers: [ada]
---

# Expire holds after ten minutes

## Context and Problem Statement

A fan needs long enough to pay without the seats moving under them, and a
sold-out event needs those seats back quickly when the fan walks away. The first
season used a per-venue duration that nobody tuned.

## Decision Drivers

- A hold must expire exactly ten minutes after it is placed, everywhere.
- Support has to be able to explain the rule to a fan on the phone.

## Considered Options

- Ten minutes for every event.
- Per-venue duration, set by venue staff.

## Decision Outcome

Chosen option: "Ten minutes for every event", because one number is the only
version support can explain, and no venue used the setting to mean anything
other than "the default".

### Consequences

- Good, because a fan is told the same rule everywhere.
- Bad, because a slow payment method on a sold-out event will lose seats that a
  longer window would have kept.
