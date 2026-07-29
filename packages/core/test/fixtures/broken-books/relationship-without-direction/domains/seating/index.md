---
id: seating
name: Seating
classification:
  domain: supporting-domain
  business-model: engagement-creator
  evolution: product
owners: [kwame]
code:
  - src/seating/**
---

## Purpose

Describe what a venue looks like from a seat: where it is, what it is worth,
and whether a fan can use it.

## Domain Roles

- Published language context: every other context reads the seat map, none of
  them write it.

## Inbound Communication

| Message         | Collaborator | Type    |
| --------------- | ------------ | ------- |
| `ImportSeatMap` | venue staff  | Command |

## Outbound Communication

| Message          | Collaborator | Type  |
| ---------------- | ------------ | ----- |
| `SeatMapChanged` | ticketing    | Event |

## Business Decisions

- A seat exists for a venue, not for an event; an event borrows the venue's
  map.

## Assumptions

- Venues send a new map when they renumber, rather than editing seats in place.

## Verification Metrics

- Seat maps imported per week, and how many needed a manual fix.

## Open Questions

- Do standing areas need seat identifiers at all, or a capacity count?
