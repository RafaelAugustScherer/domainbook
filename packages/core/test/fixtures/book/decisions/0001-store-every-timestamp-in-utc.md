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

## Pros and Cons of the Options

### Store UTC everywhere, convert at the edge

- Good, because any two timestamps compare without loading the venue.
- Neutral, because the conversion still has to be written once per surface.
- Bad, because a raw timestamp read in a log is never the time the fan saw.

### Store local time with an offset column

- Good, because the stored value matches what the venue printed.
- Neutral, because the offset is enough for display but not for arithmetic.
- Bad, because an offset does not survive a daylight-saving change, which is
  the bug that started this.

### Store local time and the venue's time zone identifier

- Good, because the venue's own calendar is reproducible from the record.
- Neutral, because it needs a time zone database wherever times are compared.
- Bad, because every expiry check turns into a lookup, and expiry is the most
  frequent comparison ticketing makes.

#### What the lookup cost

A time zone lookup per expiry check added four milliseconds to a hold sweep that
already runs every second, measured against the first season's load test.

## More Information

Revisit if boxoffice ever sells for venues that publish schedules in local time
without an identifier.
