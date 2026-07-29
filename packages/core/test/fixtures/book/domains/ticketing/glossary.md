# Ticketing glossary

The ubiquitous language of the ticketing context.

## Event

A performance with seats on sale: it has a published seat map, a hold window,
and a door time. Ticketing never sells for a performance until all three exist,
so a performance the box office knows about is not yet an event here.

- **Status:** validated
- **Example:** A show announced without a seat map is not an event to ticketing
  until seating publishes one.

## Hold

A claim on named seats that keeps other fans out of them for ten minutes while
one fan pays. A hold is not a ticket and never becomes one on its own.

- **Aliases:** reservation, lock
- **Status:** validated
- **Example:** A hold placed at 10:00 on A1 and A2 releases both seats at 10:10.
- **Example:** A fan who abandons checkout leaves a hold behind; nobody cancels it.

## Seat Map

The arrangement of seats a venue offers for an event, read from seating and
never edited here.

- **Aliases:** map
- **Status:** validated
- **Example:** Two events in the same venue on one day read the same seat map.

## Sale

A payment captured against a hold, before the hold expired. A sale is what
issues a ticket.

- **Status:** draft
- **Example:** A capture that lands after the hold expired is refunded and is not a sale.
