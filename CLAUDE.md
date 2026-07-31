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

## Say what you did not do

At the end of a phase, name what was left out and why, in the PR and in the
handover — scope you dropped, a criterion you could not meet, a decision you took
that nobody asked you to take. A phase reported as complete with a quiet gap in
it is worse than one reported as nine-tenths done.
