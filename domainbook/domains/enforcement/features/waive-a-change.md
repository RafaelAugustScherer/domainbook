---
id: waive-a-change
name: Waive a change
status: implemented
owners: [RafaelAugustScherer]
terms: [waiver, trailer, book]
decisions: [enforcement/ADR-0002]
---

## Story

As someone whose change genuinely does not need a book update
I want to say so in the commit itself, in one line, and be let through
So that the check stays installed instead of being the thing everyone works around

## Rule: A waiver is a trailer on the commit that needs it

```gherkin
Example: A reason in the trailer block clears the commit
  Given src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  And the commit message ends with the trailer Skip-Docs: renamed a private helper, no behaviour or vocabulary changed
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: domainbook: waived — Skip-Docs: renamed a private helper, no behaviour or vocabulary changed
  And it exits 0

Example: The waiver survives into history as a trailer git can query
  Given a commit was waived that way
  When git log --format=%(trailers:key=Skip-Docs,valueonly) -1 runs
  Then it prints: renamed a private helper, no behaviour or vocabulary changed

Example: The same words in the middle of the message are not a trailer
  Given src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  And the commit message body holds the line Skip-Docs: not worth documenting followed by a paragraph of prose
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
  And it exits 1

Example: One waiver clears the whole commit, not one domain of it
  Given src/ticketing/hold.ts and src/billing/refund.ts are staged and neither domain's book is
  And the commit message ends with the trailer Skip-Docs: moved both modules under a new folder, nothing else changed
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it exits 0
```

## Rule: An agent must write a reason; a person at a terminal need not

```gherkin
Example: An agent shell with an empty trailer is refused
  Given the shell exports CLAUDECODE=1
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  And the commit message ends with the trailer Skip-Docs: with nothing after it
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: the "Skip-Docs" trailer on this commit carries no reason — write what makes this change safe to leave undocumented, as in "Skip-Docs: renamed a private helper, no behaviour changed"
  And it exits 1

Example: An agent reaching for the human escape is told which one is its own
  Given the shell exports CLAUDECODE=1 and SKIP_DOCS=1
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: SKIP_DOCS=1 waives without a reason, and this shell is an agent's — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead
  And it exits 1

Example: A person at a terminal waives with the variable and no prose
  Given the shell exports SKIP_DOCS=1 and no agent marker
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: domainbook: waived — Skip-Docs: human bypass
  And it exits 0
```

## Rule: SKIP_DOCS=1 is stamped into the message, so history reads the same either way

```gherkin
Example: The stamped trailer is written into the message file
  Given the shell exports SKIP_DOCS=1 and no agent marker
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  And the commit message is one line reading Move the hold sweeper
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then .git/COMMIT_EDITMSG ends with the trailer Skip-Docs: human bypass
  And git log --format=%(trailers:key=Skip-Docs,valueonly) -1 prints: human bypass

Example: A person who wrote their own reason keeps it
  Given the shell exports SKIP_DOCS=1 and no agent marker
  And the commit message ends with the trailer Skip-Docs: vendored file, upstream owns the docs
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then the message file still ends with the trailer Skip-Docs: vendored file, upstream owns the docs
  And no second Skip-Docs trailer is added

Example: Nothing is stamped when nothing needed waiving
  Given the shell exports SKIP_DOCS=1 and no agent marker
  And only README.md is staged
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then the message file is unchanged
  And it exits 0

Example: Without a message file there is nothing to stamp and nothing to read
  Given the shell exports SKIP_DOCS=1 and no agent marker
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged runs
  Then it prints: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
  And it prints: this run read no commit message, so a waiver on it could not be seen — the commit-msg hook passes one, and "domainbook check --staged --message-file <file>" does too
  And it exits 1
```

## Rule: require_reason always holds everyone to the agent's bar

```gherkin
Example: A person is refused the wordless escape when the repo asked for prose
  Given a book whose config sets enforcement.require_reason to always
  And the shell exports SKIP_DOCS=1 and no agent marker
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it prints: SKIP_DOCS=1 waives without a reason, and this book sets enforcement.require_reason to always — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead
  And it exits 1
  And the message file is unchanged

Example: A person who writes the reason is let through either way
  Given a book whose config sets enforcement.require_reason to always
  And the commit message ends with the trailer Skip-Docs: vendored file, upstream owns the docs
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it exits 0
```

## Rule: The trailer key is the repo's to choose

```gherkin
Example: A repo that renamed the key is answered in its own words
  Given a book whose config sets enforcement.trailer to Docs-Waiver
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then the line ends: or waive this commit with a "Docs-Waiver: <reason>" trailer
  And it exits 1

Example: The default key is not read once another is named
  Given a book whose config sets enforcement.trailer to Docs-Waiver
  And the commit message ends with the trailer Skip-Docs: renamed a private helper
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then it exits 1

Example: The stamped trailer uses the configured key too
  Given a book whose config sets enforcement.trailer to Docs-Waiver
  And the shell exports SKIP_DOCS=1 and no agent marker
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When domainbook check --staged --message-file .git/COMMIT_EDITMSG runs
  Then the message file ends with the trailer Docs-Waiver: human bypass
  And it exits 0
```

## Open Questions

None. The three costs this feature carries — the environment marker being a
heuristic, a rebase dropping a trailer, and nothing judging whether a reason is a
good one — are the ones `enforcement/ADR-0002` weighed and accepted when the
trailer was chosen.
