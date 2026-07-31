---
status: accepted
date: 2026-07-31
decision-makers: [RafaelAugustScherer]
---

# Write a decision only for what a scenario cannot show

## Context and Problem Statement

Two phases produced forty-five decision records, nearly all of them written by an
agent while it worked. Nothing said which choices earn one, so the log grew to
whatever seemed worth writing at the time, and the records arrive at one weight:
"Ship everything as MIT open source" (`ADR-0001`) sits beside "Compute the slug
rules in one place" (`core/ADR-0006`), which is a helper that was copied twice and
is now copied once.

A log read years later is read to find what constrains the reader. Every record
that constrains nothing is one more to open and put down, and enough of them turn
the log into a place where the load-bearing decisions hide.

## Decision Drivers

- Behaviour has a home already. A choice a user can observe belongs in a feature
  file's scenarios (`format/ADR-0008`), and a choice written in both places is
  written twice, which means it drifts.
- An internal structure choice is undone by the next refactor. Recording it does
  not make it durable; it makes the log longer.
- The bar is applied by an agent working alone, mid-task, with nobody to ask. A
  bar that depends on knowing what a particular person cares about is a bar the
  agent has to guess at, and it will guess wrong in both directions.
- The scarce resource here is the reader's attention, not disk. This is the
  opposite of the assumption behind the widest convention in use, which is
  written for many teams who would otherwise solve the same problem twice and
  never learn of each other.

## Considered Options

- A choice earns a decision when reversing it would cost something and no
  scenario would show it.
- A choice earns a decision when the people named in `decision-makers` would have
  wanted a say in it.
- Either of those two qualifying on its own.
- Record almost every deliberate choice, on the argument that small ones compound
  into a migration later.

## Decision Outcome

Chosen option: "expensive to reverse, and no scenario would show it" — two tests,
applied in that order.

First, can a user observe the choice, in what `validate` prints or what `new`
writes? Then it is behaviour, and its home is the feature file. Second, of what
survives, would reversing it later cost something — a dependency, a package
boundary, a format commitment, an enforcement rule, a published contract? Then it
is a decision. What is left is internal structure a refactor can undo, and the
code is its own record.

"Would the people have wanted a say" was rejected as the test, though it is the
question that started this. Swapping the frontmatter parser (`format/ADR-0011`)
is a call nobody wants to be woken up for and one this project would pay for
reversing; a bar that drops it is measuring the wrong thing. Attribution is the
real answer to that worry, and it is `format/ADR-0019`, not this record.

Four existing records do not meet the bar and are retired by this one:

| Record | Why | Where the content went |
|---|---|---|
| `core/ADR-0005` | observable in what `new` writes | `scaffold-a-book` scenarios |
| `format/ADR-0012` | observable in what `validate` prints | `validate-a-book` scenarios |
| `core/ADR-0006` | internal, undone by a refactor | nowhere — the code says it |
| `core/ADR-0007` | internal, undone by a refactor | nowhere — the code says it |

Each is marked `deprecated` and says so in More Information. That word is used
here in a sense MADR does not have: the choice still holds and the code still
does what the record describes — it is the *record* that is retired, not the
decision. Adding a `retired` status was the alternative and was rejected because
it widens a status set that `format/ADR-0004` deliberately closed, and publishes
a value no other tool reading MADR would know.

The other forty-one records stand. Two that read as candidates were examined and
kept: `core/ADR-0003` fixes the shape of every issue the CLI prints, which is its
whole interface, and `format/ADR-0018` decides that the published JSON Schema
deliberately does not carry the glob rule — both are contracts someone outside
this repo depends on.

### Consequences

- Good, because the log is read for the thing it is for. What is left is
  dependencies, boundaries, formats, and rules — the records that change what a
  reader may do next.
- Good, because behaviour has one home, so a scenario and a decision can no
  longer disagree about what the tool does.
- Good, because an agent can apply the bar without a conversation, which is the
  condition under which it will actually be applied.
- Bad, because "would cost something to reverse" is a judgment, and two authors
  will draw it in different places. The bar narrows the argument; it does not end
  it.
- Bad, because `deprecated` now carries two meanings in this book, and the site's
  status badge cannot tell them apart. A reader has to open the record.
- Bad, because the other forty-one were not re-examined one at a time. Only the
  four named here were, so a record below the bar may well survive in the log.
- Neutral, because nothing is deleted. A retired record keeps its number and its
  text, and git keeps the rest.

### Confirmation

The bar is in `CONTRIBUTING.md`, where the working rules live (`ADR-0012`), so it
reaches a contributor and an agent by the same route. Nothing checks it — like
the immutability rule (`format/ADR-0004`) and the handle rule
(`format/ADR-0013`), it is checked by eye at review. The tell that it is working
is a phase that ends with fewer decisions than the one before it and more
scenarios.
