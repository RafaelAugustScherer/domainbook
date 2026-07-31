---
"@domainbook/core": minor
---

Say who decided, and stop recording what a scenario already shows.

A decision may now carry `authored-by: agent`, marking one an agent took without
the people in `decision-makers` weighing it. The field is optional and absent by
default, and its absence means the record is aligned. `decision-makers` keeps its
meaning either way — the people accountable, named by their host handle — because
accountability does not move when an agent chooses. `agent` is the only value:
what a reader needs is that no person weighed this, not which assistant was at
the keyboard. `decision.schema.json` carries it as a `const`, so an editor rejects
anything else as it is typed.

Nothing enforces it. No diff, commit, or file shows whether a person weighed a
choice, so the field is honesty rather than a guarantee.

Alongside it, a bar for what earns a decision record at all: a choice a user can
observe is behaviour and belongs in a feature file's scenarios; what is left earns
a record only if reversing it would cost something. Four records in domainbook's
own book fail that bar and are retired — the choices still hold and no code
changed, but the records read `deprecated` and what was observable in two of them
is now scenarios.
