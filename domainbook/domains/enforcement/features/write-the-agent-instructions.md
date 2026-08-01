---
id: write-the-agent-instructions
name: Write the agent instructions
status: implemented
owners: [RafaelAugustScherer]
terms: [instruction-layer, enforcement-loop, ubiquitous-language, waiver]
decisions: [ADR-0005, enforcement/ADR-0001]
---

## Story

As an agent starting work in a repo I have not seen before
I want the documentation rule and the exact waiver syntax in the file I already read
So that I meet the rule before a hook has to teach it to me

## Rule: The rule is written where every agent already looks

```gherkin
Example: A repo with no agent instructions gets them
  Given a git repo with a book at domainbook and no AGENTS.md
  When domainbook instructions runs
  Then it writes AGENTS.md holding the rule, the waiver syntax, and the domains with the code each one claims
  And it writes CLAUDE.md holding the line @AGENTS.md
  And it prints: AGENTS.md and CLAUDE.md are written — an agent reading either now knows the rule and how to waive it
  And it exits 0

Example: The section says what to do, in the words the check will use
  Given a repo where domainbook instructions has run
  Then AGENTS.md holds: changing code a domain claims means updating that domain's book in the same commit, or waiving it with a "Skip-Docs: <reason>" trailer
  And AGENTS.md names domainbook/domains/ticketing/ as the book for src/ticketing/**

Example: A renamed trailer key is the one the instructions teach
  Given a book whose config sets enforcement.trailer to Docs-Waiver
  When domainbook instructions runs
  Then AGENTS.md holds the waiver syntax as "Docs-Waiver: <reason>"

Example: The Gemini snippet is printed for a person to paste, never written
  Given a git repo with a book at domainbook
  When domainbook instructions runs
  Then it prints the settings block to add for Gemini CLI
  And it writes no Gemini settings file
  And it prints: that block is yours to paste — domainbook does not edit a settings file it did not write
```

## Rule: Regenerating replaces what domainbook wrote and nothing else

```gherkin
Example: Someone else's prose survives the rewrite
  Given an AGENTS.md holding three paragraphs a person wrote
  And a domainbook section between its markers
  When domainbook instructions runs again
  Then the three paragraphs are unchanged
  And only the text between the markers is replaced

Example: Running twice over an untouched repo changes nothing
  Given a repo where domainbook instructions has run
  When domainbook instructions runs again
  Then no file changes
  And it prints: AGENTS.md and CLAUDE.md are up to date

Example: A CLAUDE.md that already includes AGENTS.md is left alone
  Given a CLAUDE.md holding a person's own instructions and the line @AGENTS.md
  When domainbook instructions runs
  Then CLAUDE.md is unchanged
```

## Rule: --check says whether the generated files are still current

```gherkin
Example: A glob that moved leaves the rule file stale, and --check names it
  Given a repo where domainbook instructions has run for ticketing
  And the ticketing domain now claims src/box-office/** instead of src/ticketing/**
  When domainbook instructions --check runs
  Then it prints: .claude/rules/domainbook-ticketing.md is out of date — run "domainbook instructions" to write it again
  And it writes nothing
  And it exits 1

Example: Files that match what would be generated are current
  Given a repo where domainbook instructions has run and the book has not changed
  When domainbook instructions --check runs
  Then it prints: AGENTS.md, CLAUDE.md and 2 rule files are up to date
  And it exits 0

Example: A rule file a person wrote is not domainbook's to call stale
  Given a repo where domainbook instructions has run
  And .claude/rules/house-style.md that a person wrote
  When domainbook instructions --check runs
  Then no line names house-style.md
```

## Rule: Path-scoped rules come from the domains' code globs

```gherkin
Example: One rule file per domain that claims code
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  When domainbook instructions runs
  Then it writes .claude/rules/domainbook-ticketing.md scoped to src/ticketing/**
  And it writes .claude/rules/domainbook-billing.md scoped to src/billing/**

Example: A domain that claims nothing gets no rule file
  Given a book whose reporting domain declares no code globs
  When domainbook instructions runs
  Then no rule file names reporting

Example: A domain that went away takes its rule file with it
  Given a repo where domainbook instructions has run for ticketing and billing
  And the billing domain is deleted from the book
  When domainbook instructions runs again
  Then .claude/rules/domainbook-billing.md is deleted
  And a rule file a person wrote is left alone
```

## Rule: The instructions name the tool that answers, rather than copying what it would say

```gherkin
Example: Terms are pulled, not pasted
  Given a book whose ticketing glossary defines hold and seat map
  When domainbook instructions runs
  Then AGENTS.md does not hold the definition of hold or seat map
  And AGENTS.md tells the agent to call explain_terms with the words it is about to use
  And AGENTS.md names where_to_document for the paths it is about to change

Example: The rule file for a context names the tool too
  Given a book whose ticketing domain claims src/ticketing/**
  When domainbook instructions runs
  Then .claude/rules/domainbook-ticketing.md tells the agent to call explain_terms
  And it says this context's own words win over the book's

Example: A glossary that is there is offered as the way to read it without MCP
  Given a book whose ticketing glossary defines hold and seat map
  When domainbook instructions runs
  Then AGENTS.md names domainbook/domains/ticketing/glossary.md as where the words are without MCP

Example: A context with no glossary is never pointed at one
  Given a book whose ticketing domain claims src/ticketing/** and keeps no glossary
  When domainbook instructions runs
  Then no line names domainbook/domains/ticketing/glossary.md
  And .claude/rules/domainbook-ticketing.md still tells the agent to call explain_terms

Example: A glossary that moves on does not leave the instructions wrong
  Given a repo where domainbook instructions has run
  When the ticketing glossary redefines hold
  Then AGENTS.md still says something true
  And nothing has to be regenerated for it to stay true
```

## Rule: Instructions are steering, and steering stops nothing

```gherkin
Example: An agent that ignores AGENTS.md is stopped anyway
  Given a repo where domainbook instructions has run
  And an agent that changed src/ticketing/hold.ts and wrote no book change
  When the agent commits
  Then the commit-msg hook blocks it

Example: A repo with instructions and no hook is not enforced
  Given a repo where domainbook instructions has run and domainbook hooks install has not
  And a change to src/ticketing/hold.ts with no book change
  When git commit runs
  Then the commit succeeds
  And the domainbook action fails on the pull request
```

## Open Questions

None.
