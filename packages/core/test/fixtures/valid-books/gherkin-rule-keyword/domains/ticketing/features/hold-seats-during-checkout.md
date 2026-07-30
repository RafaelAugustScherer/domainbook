---
id: hold-seats-during-checkout
name: Hold seats during checkout
status: implemented
owners: [ada]
---

## Story

As a fan buying tickets
I want the seats I picked kept for me while I pay
So that they are still mine when the payment goes through

## Rule: A hold expires ten minutes after it is placed

```gherkin
Rule: A hold expires ten minutes after it is placed

  Example: Seats go back on sale when the hold expires
    Given a hold on seats A1 and A2 placed at 10:00
    When the time reaches 10:10 and no payment has been captured
    Then seats A1 and A2 are on sale again

  Example: A hold is not extended by picking more seats
    Given a hold on seat A1 placed at 10:00
    When the fan adds seat A2 at 10:07
    Then the hold on A1 and A2 expires at 10:10
```

## Open Questions

- What does a fan see if the refund itself fails?
