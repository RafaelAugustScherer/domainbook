---
id: access-control
name: Access control
classification:
  domain: generic
  business-model: compliance-enforcer
  evolution: commodity
code:
  - src/access/**
---

## Purpose

Decide, at the door, whether the thing in a fan's hand opens it — once.

## Domain Roles

- Enforcement context: it answers yes or no and records why.

## Inbound Communication

| Message        | Collaborator | Type    |
| -------------- | ------------ | ------- |
| `TicketIssued` | ticketing    | Event   |
| `ScanTicket`   | door scanner | Command |

## Outbound Communication

| Message        | Collaborator | Type  |
| -------------- | ------------ | ----- |
| `TicketFailed` | ticketing    | Event |
| `FanAdmitted`  | ticketing    | Event |

## Business Decisions

- A ticket opens a door once; a second scan is refused and recorded.
- A door keeps admitting fans while offline, and reconciles scans afterwards.

## Assumptions

- Every door scanner holds the event's issued tickets before doors open.

## Verification Metrics

- Refused scans per event, split by reason.
- Scans reconciled late after an offline door.

## Open Questions

- How long after an event ends should a ticket still scan for re-entry?
