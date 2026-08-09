---
id: groom-the-glossary
name: Groom the glossary
status: ready
owners: [RafaelAugustScherer]
terms: [skill, ubiquitous-language, domain]
decisions: [ADR-0007, format/ADR-0005]
---

## Story

As a maintainer whose code and words have drifted apart
I want a procedure that finds where they disagree and asks me about each one
So that the glossary keeps saying what the team actually says

## Rule: Grooming reports disagreements and does not resolve them alone

```gherkin
Example: A word the code uses and the glossary does not is proposed
  Given the ticketing code uses sweep in four files
  And the ticketing glossary has no term Sweep
  When the groom-the-glossary skill runs
  Then it proposes Sweep and names where the code uses it

Example: A term the code no longer uses is reported for the maintainer to judge
  Given the glossary defines Reservation
  And no code and no artifact writes the word
  Then the skill reports Reservation as unused and asks what to do with it
  And it changes no glossary file on its own

Example: Nothing is written before the maintainer answers
  Given a run that found six disagreements
  When the maintainer has answered none of them
  Then no glossary file has changed

Example: The run says what it looked at
  Given a run over the ticketing context
  Then it names the paths it read and the glossary it compared them against
```

## Rule: The skill proposes a term only when the repo uses it and it reads two ways

```gherkin
Example: A word with one obvious meaning is not proposed
  Given the code uses the word file
  Then the skill does not propose File

Example: A word the repo does not use is not proposed
  Given the maintainer's own vocabulary includes patron and no file in the repo writes it
  Then the skill does not propose Patron
  And it asks whether the code should be using it instead

Example: A word two contexts read differently is proposed to each of them
  Given billing and ticketing both write hold and mean different things by it
  Then the skill proposes Hold for each context's own glossary
  And it does not propose Hold for the book's glossary
```

## Rule: A term belongs to the context that owns the word

```gherkin
Example: A word one context uses goes in that context's glossary
  Given only the ticketing code writes seat map
  Then the skill proposes Seat map for domains/ticketing/glossary.md

Example: A word every context uses the same way goes in the book's glossary
  Given billing, ticketing and reporting all write settlement and mean one thing
  Then the skill proposes Settlement for the book's glossary

Example: A context with no glossary yet gets one rather than a term in the wrong file
  Given the ticketing context has no glossary.md
  And a term that belongs to it is confirmed
  Then the skill writes domains/ticketing/glossary.md holding that term
```

## Rule: A word that moved keeps its old form findable

```gherkin
Example: A renamed term is deprecated and aliased, not overwritten
  Given the glossary defines Reservation and the team now says Hold
  Then the skill proposes Hold as the term
  And it proposes reservation as an alias on it
  And it does not delete Reservation unless the maintainer says to

Example: A definition the maintainer corrects becomes validated
  Given a term with status draft that the maintainer corrects
  Then its status becomes validated

Example: A term the maintainer confirms is abandoned is deprecated, not removed
  Given the skill reported waitlist as unused
  And the maintainer confirms nobody uses it any more
  Then the term's status becomes deprecated
  And the term stays in the glossary
```

## Rule: Grooming ends with the book still validating

```gherkin
Example: The run is checked, not assumed
  Given the skill wrote three terms
  Then it has run domainbook validate
  And it reports that command's own output

Example: A term a feature points at is never left dangling
  Given a feature whose terms list holds reservation
  And the maintainer confirms renaming Reservation to Hold
  Then the skill updates that feature's terms list in the same run
  And domainbook validate reports no issue for it
```

## Open Questions

None.
