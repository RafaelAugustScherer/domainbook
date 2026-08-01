---
id: install-the-git-hook
name: Install the git hook
status: implemented
owners: [RafaelAugustScherer]
terms: [enforcement-loop, book-root, waiver]
decisions: [enforcement/ADR-0001]
---

## Story

As someone setting domainbook up in a repo
I want one command to put the check in front of every commit
So that the guarantee does not depend on anyone remembering to run it

## Rule: install writes a commit-msg hook that runs the same check

```gherkin
Example: A repo with no hooks gets one
  Given a git repo with a book at domainbook and no commit-msg hook
  When domainbook hooks install runs
  Then it writes .git/hooks/commit-msg
  And the file is executable
  And the check sits between the markers # domainbook:start and # domainbook:end
  And it prints: .git/hooks/commit-msg is installed — every commit now runs "domainbook check --staged"
  And it prints: next: run "domainbook instructions" to write the rule where agents will read it
  And it exits 0

Example: A book that has moved is a refusal at commit time, cleared by installing again
  Given the hook was installed against docs/book
  And the book has since moved to domainbook
  When git commit -m "Move the hold sweeper" runs
  Then the commit does not happen
  And git prints: docs/book: no book here — run "domainbook init docs/book" to write one
  And domainbook hooks install domainbook clears it

Example: The installed hook blocks the commit the check blocks
  Given the hook is installed in a repo whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When git commit -m "Move the hold sweeper" runs
  Then the commit does not happen
  And git prints: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer

Example: A domainbook installed only as a dependency is the one the hook runs
  Given a repo whose only domainbook is the one under node_modules
  And the hook is installed in it
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When git commit -m "Move the hold sweeper" runs
  Then the commit does not happen
  And git prints the ticketing line

Example: A book somewhere else is remembered by the hook
  Given a git repo with a book at docs/book
  When domainbook hooks install docs/book runs
  Then .git/hooks/commit-msg runs the check against docs/book
```

## Rule: An existing hook is added to, never replaced

```gherkin
Example: The check is appended below what was already there
  Given a git repo with a book at domainbook
  And .git/hooks/commit-msg is a shell script domainbook did not write
  When domainbook hooks install runs
  Then the lines that were already in the file are unchanged
  And the file ends with a block between the markers # domainbook:start and # domainbook:end
  And that block runs domainbook check --staged --message-file "$1"
  And it prints: .git/hooks/commit-msg already existed, so the check was added to the end of it — the hook that was there runs first and still decides first
  And it exits 0

Example: The hook that was already there still gets to refuse
  Given .git/hooks/commit-msg holds a check of someone else's that exits 1
  And domainbook hooks install has added its block below that check
  When git commit -m "Move the hold sweeper" runs
  Then the commit does not happen
  And the other check's message is what git prints

Example: Re-running replaces the block rather than adding a second
  Given a git repo whose .git/hooks/commit-msg carries the domainbook block
  When domainbook hooks install runs
  Then the file holds one # domainbook:start marker
  And it prints: .git/hooks/commit-msg is up to date — every commit runs "domainbook check --staged"
  And it exits 0

Example: A hook domainbook wrote on its own is rewritten whole
  Given a git repo whose .git/hooks/commit-msg domainbook wrote and nobody has edited
  When domainbook hooks install runs
  Then it prints: .git/hooks/commit-msg is up to date — every commit runs "domainbook check --staged"
  And it exits 0
```

## Rule: A hook a shell line cannot be added to is handed back instead

```gherkin
Example: A hook written in another language is not appended to
  Given .git/hooks/commit-msg opens with the shebang #!/usr/bin/perl
  When domainbook hooks install runs
  Then it refuses with: .git/hooks/commit-msg is a perl script, and the check is a shell line — add the equivalent of "domainbook check --staged --message-file \"$1\"" to it yourself, or move it aside and run this again
  And .git/hooks/commit-msg is unchanged
  And it exits 1

Example: A hook that ends by exiting would never reach the check
  Given .git/hooks/commit-msg is a shell script whose last line is exit 0
  When domainbook hooks install runs
  Then it refuses with: .git/hooks/commit-msg ends with "exit 0", so a check appended below it would never run — put "domainbook check --staged --message-file \"$1\"" above that line yourself, or move the hook aside and run this again
  And .git/hooks/commit-msg is unchanged
  And it exits 1

Example: A hook with no shebang is treated as shell, the way git runs it
  Given .git/hooks/commit-msg is a script with no shebang line
  When domainbook hooks install runs
  Then the check is appended between the markers
  And it exits 0
```

## Rule: uninstall removes domainbook's block and touches nothing else

```gherkin
Example: The block goes and the rest of the hook stays
  Given .git/hooks/commit-msg holds someone else's check and the domainbook block below it
  When domainbook hooks uninstall runs
  Then the markers and everything between them are gone
  And every other line in the file is unchanged
  And the file is still executable
  And it prints: the domainbook block is removed from .git/hooks/commit-msg — what was already in that hook is untouched
  And it exits 0

Example: A hook that was only ever domainbook's goes with it
  Given .git/hooks/commit-msg holds a shebang and the domainbook block and nothing else
  When domainbook hooks uninstall runs
  Then .git/hooks/commit-msg is deleted
  And it prints: .git/hooks/commit-msg held nothing but the domainbook block, so the hook is removed
  And it exits 0

Example: A hook with no block of ours is not edited
  Given .git/hooks/commit-msg is a shell script with no domainbook markers in it
  When domainbook hooks uninstall runs
  Then .git/hooks/commit-msg is unchanged
  And it prints: .git/hooks/commit-msg carries no domainbook block, so nothing was removed
  And it exits 0

Example: No hook at all is nothing to do, not a failure
  Given a git repo with no .git/hooks/commit-msg
  When domainbook hooks uninstall runs
  Then it prints: there is no .git/hooks/commit-msg here, so nothing was removed
  And it exits 0

Example: Uninstalling and installing again leaves what it started with
  Given .git/hooks/commit-msg holds someone else's check and the domainbook block below it
  When domainbook hooks uninstall runs and domainbook hooks install runs after it
  Then the file holds someone else's check and one domainbook block
```

## Rule: A repo that manages its own hooks is given the snippet instead

```gherkin
Example: lefthook owns .git/hooks, so nothing is written into it
  Given a git repo with a book at domainbook and a lefthook.yml at the repo root
  When domainbook hooks install runs
  Then it writes nothing
  And it prints: lefthook.yml is here, and lefthook rewrites .git/hooks — add this to lefthook.yml instead:
  And it prints the commit-msg job that runs domainbook check --staged --message-file {1}
  And it exits 0
```

## Rule: Outside a git repo, or outside a book, install refuses

```gherkin
Example: No git repo is a refusal naming git
  Given a folder with a book at domainbook and no .git
  When domainbook hooks install runs
  Then it refuses with: there is no git repo here — a commit hook needs one, so run "git init" first, or run this from inside the repo the book documents
  And it exits 1

Example: No book is a refusal naming init
  Given a git repo with no domainbook folder
  When domainbook hooks install runs
  Then it refuses with: domainbook: no book here — run "domainbook init domainbook" to write one
  And it exits 1

Example: uninstall outside a git repo refuses the same way
  Given a folder with a book at domainbook and no .git
  When domainbook hooks uninstall runs
  Then it refuses with: there is no git repo here — a commit hook needs one, so run "git init" first, or run this from inside the repo the book documents
  And it exits 1
```

## Rule: The hook is the clone's to install, and never the repo's hook configuration to take over

```gherkin
Example: A fresh clone commits freely until someone installs the hook
  Given a clone of a repo whose book claims src/ticketing/**
  And nobody has run domainbook hooks install in it
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When git commit -m "Move the hold sweeper" runs
  Then the commit succeeds
  And the domainbook action fails on the pull request

Example: core.hooksPath is left as the repo set it
  Given a git repo whose core.hooksPath points at .githooks
  When domainbook hooks install runs
  Then core.hooksPath still points at .githooks
  And the hook is written under .githooks rather than .git/hooks
```

## Open Questions

None.
