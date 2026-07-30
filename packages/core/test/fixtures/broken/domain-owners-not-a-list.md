---
id: ticketing
name: Ticketing
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: ada
code:
  - src/ticketing/**
---

## Purpose

Turn a chosen seat into a paid ticket.

## Domain Roles

- Execution context.

## Inbound Communication

| Message     | Collaborator | Type    |
| ----------- | ------------ | ------- |
| `HoldSeats` | web checkout | Command |

## Outbound Communication

| Message        | Collaborator   | Type  |
| -------------- | -------------- | ----- |
| `TicketIssued` | access-control | Event |

## Business Decisions

- One seat carries one ticket for one event.

## Assumptions

- Seat identifiers are stable for the life of an event.

## Verification Metrics

- Holds that expire without payment, per event.

## Open Questions

- Should an expired hold offer a queue position?
