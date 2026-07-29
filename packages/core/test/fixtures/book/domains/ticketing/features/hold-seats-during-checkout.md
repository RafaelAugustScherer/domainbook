---
id: hold-seats-during-checkout
name: Hold seats during checkout
status: implemented
owners: [ada]
terms: [hold, seat-map, sale]
decisions: [ticketing/ADR-0001, ADR-0001]
---

## Story

As a fan buying tickets
I want the seats I picked kept for me while I pay
So that they are still mine when the payment goes through

## Rule: A hold expires ten minutes after it is placed

```gherkin
Example: Seats go back on sale when the hold expires
  Given a hold on seats A1 and A2 placed at 10:00
  When the time reaches 10:10 and no payment has been captured
  Then seats A1 and A2 are on sale again
  And the fan is told the hold expired

Example: A hold is not extended by picking more seats
  Given a hold on seat A1 placed at 10:00
  When the fan adds seat A2 at 10:07
  Then the hold on A1 and A2 expires at 10:10
```

## Rule: Payment captured before the hold expires issues a ticket

```gherkin
Example: Paying inside the window issues one ticket per seat
  Given a hold on seats A1 and A2 placed at 10:00
  When the payment is captured at 10:04
  Then a ticket is issued for seat A1
  And a ticket is issued for seat A2
```

## Rule: Payment captured after the hold expires is refunded

```gherkin
Example: A late capture never becomes a ticket
  Given a hold on seat A1 placed at 10:00
  And the hold expired at 10:10
  When the payment is captured at 10:11
  Then the payment is refunded in full
  And no ticket is issued for seat A1
```

## Open Questions

- What does a fan see if the refund itself fails?
- Should a fan who loses a sold-out hold be offered a queue position?
