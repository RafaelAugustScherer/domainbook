---
id: hold-seats-during-checkout
name: Hold seats during checkout
status: draft
owners: [ada]
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
```

## Rule: A fan who loses a sold-out hold keeps a place in the queue

```gherkin
Background:
  Given an event whose seats are all sold or held
```

## Open Questions

- How long does a queued fan hold their place before it passes on?
