---
id: block-an-agent-at-stop
name: Block an agent at stop
status: ready
owners: [RafaelAugustScherer]
terms: [enforcement-loop, waiver, instruction-layer]
decisions: [enforcement/ADR-0001, ADR-0005]
---

## Story

As an agent finishing a task that changed code a domain claims
I want to be stopped before I hand back, with the stale files named
So that I write the documentation now, while I still remember what I changed

## Rule: A session that changed mapped code and left the book alone does not end

```gherkin
Example: The agent is sent back with the domain named
  Given a Claude Code session in a repo whose ticketing domain claims src/ticketing/**
  And the session edited src/ticketing/hold.ts and nothing under domainbook/domains/ticketing/
  When the session tries to stop
  Then the stop is blocked
  And the agent is told: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer

Example: The block clears once the book is written
  Given a session that was blocked for the ticketing book
  When the agent writes domainbook/domains/ticketing/changelog.md and tries to stop again
  Then the stop is allowed
  And nothing is printed to the agent

Example: A session that touched nothing a domain claims ends silently
  Given a Claude Code session in a repo whose ticketing domain claims src/ticketing/**
  And the session edited README.md only
  When the session tries to stop
  Then the stop is allowed
  And nothing is printed to the agent

Example: The whole session is the unit, not the last edit
  Given a session that edited src/ticketing/hold.ts early on
  And the session edited README.md most recently
  When the session tries to stop
  Then the stop is blocked for ticketing

Example: A file edited and then put back is not a change to document
  Given a session that edited src/ticketing/hold.ts and later restored it to what it was
  When the session tries to stop
  Then the stop is allowed
  And nothing is printed to the agent
```

## Rule: A block never repeats itself into a loop

```gherkin
Example: A stop that is already the result of a block is let through
  Given a session whose stop payload reports stop_hook_active as true
  And the session edited src/ticketing/hold.ts and nothing under domainbook/domains/ticketing/
  When the session tries to stop
  Then the stop is allowed

Example: The third block over one session is the last
  Given a session that has been blocked twice for the ticketing book
  And the session still edited src/ticketing/hold.ts and nothing under domainbook/domains/ticketing/
  When the session tries to stop a third time
  Then the stop is blocked
  And the agent is told: this is the third time — write the ticketing book or say why it does not need writing, because this hook will not stop you again; the commit-msg hook and the pull request will

Example: The fourth stop is allowed even though nothing was fixed
  Given a session that has been blocked three times for the ticketing book
  When the session tries to stop again
  Then the stop is allowed
  And the git hook and CI still hold the same change

Example: The count is the session's, not the repo's
  Given a session that was blocked three times and then ended
  When a new session edits src/ticketing/hold.ts and tries to stop
  Then the stop is blocked
```

## Rule: Editing is never interrupted mid-session

```gherkin
Example: Writing a file records the path and says nothing
  Given a Claude Code session in a repo whose ticketing domain claims src/ticketing/**
  When the agent edits src/ticketing/hold.ts
  Then the edit succeeds
  And nothing is printed to the agent
  And src/ticketing/hold.ts is recorded for the stop-time check

Example: Ten edits in a row produce ten silences
  Given a session that edits ten files under src/ticketing/
  Then the agent is told nothing until it tries to stop
```

## Rule: The escapes a person has are not the agent's

```gherkin
Example: The human escape is denied to an agent
  Given a Claude Code session in a repo with the plugin installed
  When the agent runs SKIP_DOCS=1 git commit -m "Move the hold sweeper"
  Then the command does not run
  And the agent is told: SKIP_DOCS=1 waives without a reason and is for a person at a terminal — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead

Example: Unsetting the marker is denied
  Given a Claude Code session in a repo with the plugin installed
  When the agent runs env -u CLAUDECODE git commit -m "Move the hold sweeper"
  Then the command does not run
  And the agent is told: unsetting CLAUDECODE makes this shell look like a person's, and the waiver rules differ — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead

Example: An ordinary commit is not touched
  Given a Claude Code session in a repo with the plugin installed
  When the agent runs git commit -m "Move the hold sweeper"
  Then the command runs
  And the commit-msg hook decides the outcome
```

## Open Questions

None. The `PreToolUse` guard matches command text, so it raises the cost of
taking a person's waiver tier rather than closing it off — which is why it is not
one of the loop's three layers and why `enforcement/ADR-0001` puts the guarantee
in the hook and CI instead.
