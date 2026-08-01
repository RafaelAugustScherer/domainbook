---
id: check-a-branch-in-ci
name: Check a branch in CI
status: implemented
owners: [RafaelAugustScherer]
terms: [enforcement-loop, waiver, book]
decisions: [enforcement/ADR-0001, enforcement/ADR-0002]
---

## Story

As a reviewer who cannot see whether anyone's hooks are installed
I want the branch checked again where nobody can skip it
So that a bypass on someone's laptop is caught before the change lands

## Rule: The action validates the book and then checks what the branch changed

```gherkin
Example: A branch that left a domain's book stale fails the action
  Given a pull request whose range changes src/billing/refund.ts
  And nothing under domainbook/domains/billing/ changes anywhere in the range
  And no commit in the range carries a Skip-Docs trailer
  When the domainbook action runs
  Then it prints: billing: src/billing/refund.ts changed and domainbook/domains/billing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
  And the action fails

Example: A book that does not validate fails the action on its own
  Given a pull request whose range changes only README.md
  And the book on the branch has a feature whose status reads shipped
  When the domainbook action runs
  Then it prints the same line domainbook validate prints for that feature
  And the action fails

Example: A branch with nothing stale and a valid book passes
  Given a pull request whose range changes src/billing/refund.ts
  And domainbook/domains/billing/changelog.md changes in the range
  When the domainbook action runs
  Then the action passes

Example: Generated instruction files that have gone stale are said out loud, not failed
  Given a pull request whose range changes a domain's code globs
  And AGENTS.md and .claude/rules/ were not regenerated in the range
  When the domainbook action runs
  Then it prints: .claude/rules/domainbook-ticketing.md is out of date — run "domainbook instructions" to write it again
  And the action passes
  And nothing about the instruction files can fail the action
```

## Rule: The range is judged as one change, not commit by commit

```gherkin
Example: The book update may arrive in a later commit than the code
  Given a pull request whose first commit changes src/billing/refund.ts
  And whose second commit changes domainbook/domains/billing/changelog.md
  When the domainbook action runs
  Then the action passes

Example: A waiver on any commit in the range clears the range
  Given a pull request whose first commit changes src/billing/refund.ts
  And whose second commit carries the trailer Skip-Docs: reverted the refund path, no behaviour left to document
  When the domainbook action runs
  Then the action passes

Example: CI is never stricter than the hook that let the commit through
  Given every commit in the range passed the commit-msg hook locally
  When the domainbook action runs
  Then the action passes
```

## Rule: A commit that skipped the local hooks is caught here

```gherkin
Example: A commit that never met the hook is met here instead
  Given a commit that reached the branch without the commit-msg hook running on it
  And that commit changes src/billing/refund.ts
  And nothing under domainbook/domains/billing/ changes anywhere in the range
  When the domainbook action runs
  Then the action fails
  And it prints the billing line

Example: A repo where nobody installed the hook is still held to the rule
  Given a pull request from a clone with no .git/hooks/commit-msg
  And whose range changes src/billing/refund.ts with no book change and no trailer
  When the domainbook action runs
  Then the action fails
```

## Rule: CI reads the same book and the same config the hook reads

```gherkin
Example: Advisory mode is advisory in CI too
  Given a book whose config sets enforcement.mode to warn
  And a pull request whose range changes src/billing/refund.ts with no book change
  When the domainbook action runs
  Then it prints the billing line
  And the action passes

Example: A renamed trailer key is the one CI reads
  Given a book whose config sets enforcement.trailer to Docs-Waiver
  And a pull request whose range changes src/billing/refund.ts
  And one commit in the range carries the trailer Docs-Waiver: vendored file, upstream owns the docs
  When the domainbook action runs
  Then the action passes

Example: A path no domain claims is as quiet in CI as it is locally
  Given a pull request whose range changes scripts/release.sh only
  When the domainbook action runs
  Then the action passes
  And no line names scripts/release.sh
```

## Rule: A range the action cannot trust is refused, not judged

```gherkin
Example: A checkout too shallow to hold the base commit is refused
  Given a pull request whose checkout does not hold the base commit
  When the domainbook action runs
  Then it refuses with: this checkout does not reach the base commit, so the range cannot be read — set fetch-depth to 0 on the checkout step, and run this again
  And the action fails
  And no line names a domain

Example: A checkout that reaches the base commit is judged normally
  Given a pull request whose checkout holds the base commit
  And whose range changes src/billing/refund.ts with no book change and no trailer
  When the domainbook action runs
  Then it prints the billing line
  And the action fails
```

## Open Questions

None.
