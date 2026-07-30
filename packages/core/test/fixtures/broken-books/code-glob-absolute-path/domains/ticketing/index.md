---
id: ticketing
name: Ticketing
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: [ada]
code:
  - /src/ticketing/**
---

## Purpose

Turn a chosen seat into a paid ticket, and keep that ticket valid until the
fan walks through the door.

## Domain Roles

- Execution context: it runs the checkout, it does not decide what a seat is.
- Gateway context: the only context that talks to the payment provider.

## Inbound Communication

| Message           | Collaborator     | Type    |
| ----------------- | ---------------- | ------- |
| `HoldSeats`       | web checkout     | Command |
| `PaymentCaptured` | payment provider | Event   |

## Outbound Communication

| Message        | Collaborator   | Type  |
| -------------- | -------------- | ----- |
| `TicketIssued` | access-control | Event |

## Business Decisions

- A hold lasts ten minutes and is never extended; a fan who needs longer starts
  again.
- One seat carries one ticket for one event.

## Assumptions

- The payment provider confirms or fails a capture within the hold window.

## Verification Metrics

- Holds that expire without payment, per event.
- Automatic refunds caused by late capture, per week.

## Open Questions

- Should a fan who loses a sold-out hold be offered a queue position?
