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
Example: Seats go back on sale when the hold expires
  Given a hold on seats A1 and A2 placed at 10:00
  When the fan is shown the countdown
    """
    Your seats are held until 10:10.

## Open Questions

- What does a fan see if the refund itself fails?
