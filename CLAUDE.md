# Working on domainbook

How the code is written is `CONTRIBUTING.md` — read it, don't wait to be told.
This file is about how a phase runs, which is a different thing and the part that
is easy to get wrong.

## A phase starts with scenarios, not code

The roadmap under `domainbook/roadmap.md` names each phase and its exit
criteria. Before writing any implementation for one:

1. Write the feature files for what the phase will deliver — the story, the
   rules, and concrete examples — at `status: draft`. Cover the exit criteria
   the roadmap names for that phase, and the refusals, not only the happy path.
2. **Stop there and hand them over.** No implementation until they are approved.
   The scenarios are the contract; if they are wrong, everything built against
   them is wrong in the same direction and nobody finds out until the end.
3. Approval flips them to `status: ready`. Then build.

If the phase as scoped contradicts the roadmap's exit criteria, or the criteria
turn out to be unbuildable as written, say so before writing the scenarios
rather than quietly documenting something else.

## A phase ends with a walkthrough that was actually run

"Done" is not a claim, it is a transcript. When the work is finished, hand back a
walkthrough the reader can run themselves:

- Numbered steps, each a copy-pasteable command, against a scratch repo outside
  this one — never against this working tree.
- Under each command, its exact output.
- One section per exit criterion, plus the failures the phase is supposed to
  produce: the commit that gets blocked, the value that gets refused, the exit
  code.

**Every line of expected output is copied from a real run.** Never write what the
code ought to print. If something cannot be run — it needs a hosted service, a
second machine, a merge to main — say so in the walkthrough and leave it
unproven rather than predicting it. An unproven step named as unproven is
useful; a predicted one that turns out wrong costs the reader their trust in the
whole document.

The walkthrough goes in the PR description, next to the *why*. It is not a new
artifact in the book: the scenarios already say what the behaviour is, and the
walkthrough is only the runnable form of them.

Once it has been run and accepted, the feature files move to
`status: implemented`.

## Ask the question, don't park it

A choice that is mine to make gets **asked, with the options laid out, at the
moment it comes up** — not noted at the end of the turn, not carried into the
next one, not left as a "worth deciding later". Options mean real alternatives
with their trade-offs, so the answer is one reply rather than a conversation.

A choice you can make yourself, make. State it in a sentence and move on. The
test is whether a different answer would change what you build: if it would, ask
before building; if it wouldn't, decide and say what you decided.

**Do not end a turn with an open item that could have been a question.** A
trailing "still open: X" puts the work of noticing and re-raising X on me, and it
leaves the task looking finished when it isn't. If X matters, it is a question in
the same turn it appeared. If it doesn't matter enough to ask, it doesn't matter
enough to mention.

**A question written into an artifact is still a parked question.** A feature's
`Open Questions` section is not a safe place to put a choice you did not want to
ask about. It is Example Mapping's red card: what nobody in the session could
answer — something that needs a user, a measurement, or a later phase to settle,
and that says which. If I could have answered it in one reply, it was never a red
card; it was a question you owed me in the turn it came up. Writing it down is
worse than saying nothing, because in a book whose point is that knowledge lives
in the repo, a parked question reads as documentation and functions as a
deferral. The section still closes every feature, and it reads `None.` when
nothing survives that test.

The same goes for a cost already weighed somewhere else. If a decision record
accepted a trade-off, the feature does not re-open it as a question — it says so
in a sentence and names the record.

This is not the same as reporting scope you deliberately left out — that is the
next section, and it is about work already decided, not about decisions still
waiting.

@AGENTS.md
