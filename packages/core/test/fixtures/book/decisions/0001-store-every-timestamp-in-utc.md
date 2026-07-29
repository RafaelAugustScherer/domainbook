---
status: accepted
date: 2026-02-11
decision-makers: [ada, kwame]
consulted: [rosa]
informed: [support]
---

# Store every timestamp in UTC

## Context and Problem Statement

Holds expire, doors open, and seasons roll over across venues in different time
zones. Storing local times made two bugs in the first season: a hold that lived
an hour too long across a daylight-saving change, and a door that opened an hour
early on tour.

## Decision Drivers

- A hold must expire exactly ten minutes after it is placed, everywhere.
- Support staff read raw timestamps when a fan disputes a scan.

## Considered Options

- Store UTC everywhere, convert at the edge.
- Store local time with an offset column.
- Store local time and the venue's time zone identifier.

## Decision Outcome

Chosen option: "Store UTC everywhere, convert at the edge", because it is the
only option where two timestamps can be compared without loading venue data, and
comparison is what every expiry rule does.

### Consequences

- Good, because expiry and ordering are plain comparisons.
- Good, because logs from every context line up without conversion.
- Bad, because every screen and export has to convert, and a missed conversion
  shows a fan the wrong door time.

### Confirmation

Reviewers check that no persisted field holds a local time. The seat map export
carries the venue time zone so the site can convert.

## More Information

Revisit if boxoffice ever sells for venues that publish schedules in local time
without an identifier.
