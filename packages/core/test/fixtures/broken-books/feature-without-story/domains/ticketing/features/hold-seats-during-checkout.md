---
id: hold-seats-during-checkout
name: Hold seats during checkout
status: implemented
owners: [ada]
---

## Rule: A hold expires ten minutes after it is placed

```gherkin
Example: Seats go back on sale when the hold expires
  Given a hold on seats A1 and A2 placed at 10:00
  When the time reaches 10:10 and no payment has been captured
  Then seats A1 and A2 are on sale again
```

## Open Questions

- What does a fan see if the refund itself fails?
