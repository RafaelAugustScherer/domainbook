---
status: accepted
date: 2026-07-31
decision-makers: [RafaelAugustScherer]
---

# Mark a decision an agent took alone

## Context and Problem Statement

Agents write nearly everything in this book, and every one of the forty-five
decision records in it carries `decision-makers: [RafaelAugustScherer]`. Some of
those were choices that person made. Most were choices an agent made while
working for them, and wrote their name under because there was nowhere else to
put it.

"Who decided this" is one of the few questions a decision log exists to answer
(`format/ADR-0013`). On most of these records the answer is wrong, and a field
that is wrong on most records is a field a reader stops believing on the ones
where it is right.

## Decision Drivers

- Wrong in the flattering direction is still wrong. A person's handle on a record
  they never read is a claim the log cannot support.
- Most agent-taken decisions are aligned: the person asked for the work, said
  what it was for, and the agent chose inside those bounds. Marking every one of
  those says nothing, because it would mark the whole book.
- Nothing in a diff, a commit, or a file shows whether a person weighed a choice.
  No check can find this, now or later.
- The people named in `decision-makers` are accountable for the repo whether or
  not they read the record. Removing them to make room for the agent trades one
  wrong answer for another.

## Considered Options

- An optional `authored-by: agent`, set only when the agent decided without the
  people in `decision-makers` weighing it, leaving that field as it is.
- The agent in `decision-makers`, with the people moved to a new `on-behalf-of`.
- The agent in `decision-makers` alone, so the absence of a person is the signal.
- `status: proposed` until a person confirms, using the status set already there.

## Decision Outcome

Chosen option: an optional `authored-by: agent`. It is absent by default, and its
absence means the record is aligned — the people in `decision-makers` weighed the
choice, whether or not they typed it. It is present when an agent decided alone,
and then `decision-makers` still names the people, because accountability did not
move.

The value is `agent`, not the name of the agent or its model. What a reader needs
is that no person weighed this; which assistant was at the keyboard is a version
string that would be stale within a release and maintained by nobody.

Moving the agent into `decision-makers` was the closest rival and would have read
more honestly on the record itself, but `format/ADR-0013` scoped that field to a
handle identifying a person on the repo's host, and a book that puts non-people
there loses the ability to answer "who do I ask about this". `status: proposed`
was rejected because it changes what a status means: these decisions are in force
— the code already does them — and a queue of records marked as proposals that
nobody will ever process is a worse lie than the one being fixed.

`decisionSchema` is a `strictObject`, so the field had to be declared before it
could be written; the generated JSON Schema carries it as a `const`. Only
decisions take it. A debt record states a fact rather than a choice, and a
feature describes behaviour, so neither has an author to disclaim.

The forty-five records written before this one keep the handle they have. That
follows the precedent `format/ADR-0013` set for a stale handle: the fix for a
record already accepted is a newer record, not an edit.

### Consequences

- Good, because a reader can tell a choice a person made from a choice made for
  them, and `grep authored-by` lists everything decided without one.
- Good, because it costs nothing on the ordinary record — the field is simply
  absent, and no existing book has to change.
- Good, because it gives an agent working autonomously somewhere honest to put
  the fact, instead of the choice between a false name and no attribution.
- Bad, because nothing enforces it. An agent that leaves it off is
  indistinguishable from one that had alignment, so the field is honesty rather
  than a guarantee.
- Bad, because it asks the agent to judge whether it was aligned — close to the
  judgment it is least placed to make. An agent that is confident it understood
  the intent is exactly the agent that will omit the field.
- Bad, because absence means aligned, so every book written before this field
  existed, and every book written by a tool that never sets it, reads as fully
  aligned.
- Neutral, because the forty-five records already here are not corrected. What
  they say about authorship is answered by this record and not by them.

### Confirmation

A decision an agent takes without asking carries the field. Nothing checks it, so
like the rules it sits beside it is checked at review; `CONTRIBUTING.md` states
it where a contributor and an agent read the same sentence.
