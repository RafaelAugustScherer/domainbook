---
id: document-this-change
name: Document this change
status: ready
owners: [RafaelAugustScherer]
terms: [skill, artifact, waiver, enforcement-loop, domain]
decisions: [ADR-0013, enforcement/ADR-0001, enforcement/ADR-0003]
---

## Story

As an agent whose session was just blocked at Stop
I want a procedure that turns the block into the book change it was asking for
So that the documentation gets written while the change is still in my head

## Rule: The procedure starts from what the block named

```gherkin
Example: The blocked context is the one that gets documented
  Given the Stop hook blocked with: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not
  When the document-this-change skill runs
  Then it reads domainbook/domains/ticketing/
  And it works on the ticketing book and no other

Example: The changed paths choose the artifact, not the context alone
  Given a block naming src/ticketing/hold.ts
  When the skill runs
  Then it calls where_to_document with src/ticketing/hold.ts
  And it reads the files that answer names

Example: The diff is read before a word is written
  Given a block over four changed files
  Then the skill has read what changed in all four
  And what it writes names the behaviour that changed rather than the files that changed

Example: A skill invoked with no block behind it asks what changed
  Given no block and no recorded session changes
  When the skill runs
  Then it asks which change is being documented
  And it writes nothing until it has one
```

## Rule: What changed decides which artifact gets written

```gherkin
Example: Changed behaviour is a scenario
  Given a change that makes a hold expire after ten minutes instead of five
  Then the skill writes the example into the feature that owns holds
  And it writes no decision saying the same thing

Example: A new word is a glossary term
  Given a change that introduces the word sweep to the ticketing code
  Then the skill proposes Sweep for the ticketing glossary

Example: A shortcut taken knowingly is a debt record
  Given a change that sweeps expired holds on a timer because the queue is not built yet
  Then the skill writes a debt record naming the shortcut, what it costs and what repayment looks like

Example: A user-visible behaviour change is also a changelog entry
  Given a change that shortens the hold window a buyer sees
  Then the skill adds an entry under Changed in the ticketing changelog

Example: A change nobody outside the repo can observe gets no changelog entry
  Given a change that renames a private helper and alters nothing a user sees
  Then the skill writes no changelog entry

Example: A choice with a cost to reverse is handed to the decision procedure
  Given a change that takes a new dependency
  Then the skill does not write the decision itself
  And it says which procedure records one
```

## Rule: The block is not cleared by touching a file that merely sits in the folder

```gherkin
Example: An unrelated edit is refused even though the check would accept it
  Given a block over src/ticketing/hold.ts
  And a stale line in domains/ticketing/changelog.md that could be edited to clear the check
  Then what the skill writes describes the change to src/ticketing/hold.ts
  And it does not clear the block by editing the unrelated stale line

Example: A second blocked context is documented too, not carried by the first
  Given a block naming ticketing and billing
  Then the skill writes into both books
  And it does not write one cross-cutting record to clear both unless the change is cross-cutting
```

## Rule: A waiver is proposed, never taken, and its reason is specific to the change

```gherkin
Example: A change that documents nothing is proposed for a waiver with what makes it safe
  Given a block over a change that only renames a private helper
  Then the skill proposes a Skip-Docs trailer
  And the reason names the rename and says no behaviour or vocabulary changed

Example: The person decides, because a waiver outlives the session
  Given a block over a change that only bumps a dependency's patch version
  Then the skill says what it would waive and why
  And the commit carries no trailer until the person answers

Example: A reason that would fit any commit is not offered
  Given a block over a behaviour change
  Then the skill does not offer "no docs needed" as a reason
  And it writes the book change instead

Example: A trailer is never proposed to hide a change the skill could not understand
  Given a change the skill cannot describe in a sentence
  Then it tells the person it cannot describe the change and asks what it does
  And it proposes no waiver
```

## Rule: The block is cleared by re-running the check, not by declaring it cleared

```gherkin
Example: The check is what says it is done
  Given the skill has written a scenario into the ticketing feature
  When it finishes
  Then it has re-run the check over the session's changes
  And it reports that check's own output

Example: A check that still fails is reported as still failing
  Given the skill wrote a file under domains/ticketing/ and the check still names billing
  Then the skill names billing
  And it does not report the block as cleared

Example: A book the change broke is fixed before the block is called done
  Given the skill's own edit leaves domainbook validate reporting an issue
  Then the skill fixes it in the same run
```

## Open Questions

None.
