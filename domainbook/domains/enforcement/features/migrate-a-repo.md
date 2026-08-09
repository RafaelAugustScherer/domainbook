---
id: migrate-a-repo
name: Migrate a repo
status: ready
owners: [RafaelAugustScherer]
terms: [migration, skill, book, domain, decision, feature]
decisions: [ADR-0005, ADR-0007, format/ADR-0004]
---

## Story

As the maintainer of a repo that has no book
I want an agent to read what is already written, ask me what only I know, and write the book from my answers
So that enforcement defends the boundaries I agreed to rather than the ones it guessed

## Rule: Everything already written is read before the first question

```gherkin
Example: The repo's own documentation is what the proposal is built from
  Given a repo holding README.md, docs/architecture.md and adr/ with nine records
  When the migrate-a-repo skill runs
  Then it reads README.md, docs/architecture.md and every file under adr/
  And the proposal it puts to the maintainer names each of them as where a claim came from

Example: A repo with nothing written is proposed from its code, and says so
  Given a repo with no README and no docs folder
  When the migrate-a-repo skill runs
  Then it says the proposal was read from the code alone, with no documentation to draw on
  And it still asks before writing anything

Example: Reading writes nothing
  Given a repo with no book
  When the migrate-a-repo skill has read the repo and asked nothing yet
  Then no file has been created
```

## Rule: A boundary is proposed and confirmed, never inferred and written

```gherkin
Example: Every proposed context is put to the maintainer before it exists on disk
  Given a repo whose code suggests billing, ordering and notifications
  When the skill proposes those three contexts
  And the maintainer confirms billing and ordering and rejects notifications
  Then the book holds domains/billing/ and domains/ordering/
  And the book holds no domains/notifications/

Example: A rejected boundary is redrawn from the maintainer's answer
  Given the skill proposed a payments context
  And the maintainer answers that payments is part of billing
  Then the proposal is redrawn with billing claiming the payments code
  And the redrawn proposal is put to the maintainer again

Example: A glob is read back with what it actually matches
  Given a proposed billing context claiming src/billing/**
  When the skill puts the context to the maintainer
  Then it says how many files in this repo that glob matches
  And it names any file the maintainer called billing that the glob misses

Example: Code nothing claims is reported rather than assigned
  Given src/shared/ that no confirmed context claims
  Then the skill names it as unclaimed
  And it does not widen a context's globs to cover it
```

## Rule: The words are the ones the repo already uses

```gherkin
Example: A proposed term names where in the code it was found
  Given the code uses seat map across the ticketing files
  When the skill proposes Seat map
  Then the proposal names a file that uses the words

Example: A word the code uses two ways is asked about rather than merged
  Given the code uses order for both a basket and a placed order
  Then the skill asks which one the word means here
  And it does not write a definition covering both
```

## Rule: A term's status says who confirmed it

```gherkin
Example: A term the maintainer confirmed is validated
  Given the maintainer confirms that a hold is a seat reserved for the length of a checkout
  Then the ticketing glossary holds Hold with that definition
  And its status is validated

Example: A term the skill proposed and nobody answered stays draft
  Given the skill proposed Settlement from the code
  And the maintainer did not confirm it
  Then the glossary holds Settlement with status draft
```

## Rule: An imported decision keeps its body and is asked for what our frontmatter needs

```gherkin
Example: A MADR file with no frontmatter is imported with its body intact
  Given adr/0004-use-postgres.md holding a MADR body and no frontmatter
  When the skill imports it
  Then its Context and Problem Statement, Considered Options and Decision Outcome are unchanged
  And the maintainer is asked for its status and the date it was taken

Example: A date nobody remembers comes from git, not from today
  Given an imported record the maintainer cannot date
  Then its date is the date git first saw that file
  And the skill says that is where the date came from
  And it does not write today's date

Example: A body that does not meet the format is fixed with the maintainer, not silently
  Given an imported record whose body has no Decision Outcome
  Then the skill names what the format requires
  And it asks the maintainer for the outcome rather than writing one

Example: Numbering is the log's, not the source's
  Given imported records numbered 4, 7 and 12 in adr/
  Then the book's log runs 0001, 0002 and 0003
  And each record says which file it came from
```

## Rule: Behaviour the code implies is proposed as a draft feature, never asserted

```gherkin
Example: A tested behaviour is proposed as a feature the maintainer confirms
  Given a test asserting a hold expires ten minutes after it is placed
  When the skill proposes features for the ticketing context
  Then it proposes a feature for the hold's expiry
  And it names the test the behaviour was read from

Example: A proposed feature is written at status draft
  Given a behaviour the maintainer confirmed
  When the skill writes its feature
  Then the feature carries status draft
  And no feature it writes reads implemented, because no walkthrough has run

Example: Behaviour nobody confirmed is not written as a feature
  Given a behaviour the skill read from the code and the maintainer did not confirm
  Then no feature file carries it
```

## Rule: The book is written with the CLI, not by hand

```gherkin
Example: The scaffold comes from the tested generators
  Given a confirmed proposal of two contexts and three decisions
  When the skill writes the book
  Then it runs domainbook init for the book root
  And it runs domainbook new domain for each confirmed context
  And it runs domainbook new decision for each record it imports
  And it fills the scaffolded files in rather than writing them from scratch
```

## Rule: The migration is finished when validate passes, and not before

```gherkin
Example: The last step is the check
  Given a book the skill has just written
  When the skill finishes
  Then it has run domainbook validate
  And it reports that command's own output

Example: A book that does not validate is reported as unfinished
  Given a written book that domainbook validate reports two issues for
  Then the skill names both issues
  And it does not report the migration as done

Example: The instruction layer is written once the book validates
  Given a book that validates
  Then the skill runs domainbook instructions
  And the repo holds AGENTS.md naming the contexts, the waiver syntax and the four procedures
```

## Rule: A repo with nobody to interview gets a scaffold, and is told that is what it got

```gherkin
Example: No answers means no confirmed boundaries
  Given a repo whose maintainer is not available to answer
  When the skill runs
  Then it writes the book root and no contexts
  And it names what to run once someone who knows the boundaries is found

Example: A guess is never written as though it had been confirmed
  Given a proposal nobody answered
  Then no domain page carries it
  And no glossary term written from it reads validated
```

## Open Questions

None.
