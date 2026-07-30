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
Scenario Outline: A hold expires ten minutes after it was placed
  Given a hold on seat <seat> placed at <placed>
  When the time reaches <expiry> and no payment has been captured
  Then seat <seat> is on sale again

  Examples:
    | seat | placed | expiry |
    | A1   | 10:00  | 10:10  |
    | B4   | 21:35  | 21:45  | 22:00 |
```

## Open Questions

- What does a fan see if the refund itself fails?
