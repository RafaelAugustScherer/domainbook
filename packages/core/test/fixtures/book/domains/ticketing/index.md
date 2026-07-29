---
id: ticketing
name: Ticketing
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: [ada]
code:
  - src/ticketing/**
relationships:
  - with: seating
    type: upstream-downstream
    direction: downstream
    patterns: [ACL]
  - with: access-control
    type: upstream-downstream
    direction: upstream
    patterns: [OHS, PL]
---

## Purpose

Turn a chosen seat into a paid ticket, and keep that ticket valid until the fan
walks through the door.

## Domain Roles

- Execution context: it runs the checkout, it does not decide what a seat is.
- Gateway context: the only context that talks to the payment provider.

## Inbound Communication

| Message           | Collaborator     | Type    |
| ----------------- | ---------------- | ------- |
| `HoldSeats`       | web checkout     | Command |
| `PaymentCaptured` | payment provider | Event   |
| `ReleaseHold`     | web checkout     | Command |

## Outbound Communication

| Message        | Collaborator   | Type    |
| -------------- | -------------- | ------- |
| `GetSeatMap`   | seating        | Query   |
| `TicketIssued` | access-control | Event   |
| `RefundSale`   | payment provider | Command |

## Business Decisions

- A hold lasts ten minutes and is never extended; a fan who needs longer starts
  again.
- Payment captured after the hold expired is refunded automatically, never
  converted into a ticket.
- One seat carries one ticket for one event.

## Assumptions

- The payment provider confirms or fails a capture within the hold window.
- Seat identifiers from seating are stable for the life of an event.

## Verification Metrics

- Holds that expire without payment, per event.
- Automatic refunds caused by late capture, per week.
- Time from `HoldSeats` to `TicketIssued`, 95th percentile.

## Open Questions

- Should a fan holding seats for a sold-out event join a queue when the hold
  expires, instead of losing the seats outright?
