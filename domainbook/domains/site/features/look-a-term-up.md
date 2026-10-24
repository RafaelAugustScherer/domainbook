---
id: look-a-term-up
name: Look a term up
status: implemented
owners: [RafaelAugustScherer]
terms: [ubiquitous-language, domain, book, feature, slug]
decisions: [format/ADR-0005, site/ADR-0001]
---

## Story

As someone reading a change that uses a word two teams mean different things by
I want the definition this context agreed on and what else uses it
So that I use the word the book already has instead of inventing a second one

## Rule: A term reads as its definition, its aliases, its examples and its status

```gherkin
Example: Everything the entry holds is on the page
  Given a term Hold defined in ticketing, with the alias reservation, two examples and status validated
  When a reader opens Hold
  Then the definition reads as written
  And reservation reads as an alias
  And both examples read
  And the entry says it is validated

Example: A term with only a definition reads as only that
  Given a term Sweep with no aliases and no examples
  When a reader opens Sweep
  Then the definition reads
  And there is no empty alias list
  And there is no empty example list

Example: A term is addressed by its slug, whatever script it is written in
  Given a term Café order in ticketing
  When a reader opens it
  Then its address ends café-order
```

## Rule: A term names what uses it

```gherkin
Example: The features that list the term are on its page
  Given three ticketing features list hold in their terms
  When a reader opens Hold
  Then all three features are named on the page
  And each of them opens

Example: A term nothing lists says so rather than showing an empty list
  Given a term Sweep that no feature lists
  When a reader opens Sweep
  Then it reads: no feature names this term yet

Example: The list is what the book declares, not every page the word appears on
  Given the word hold appears in a billing decision that does not list it
  And three ticketing features list hold in their terms
  When a reader opens Hold
  Then the three features are named
  And the billing decision is not
  And it reads: searching for the word finds every page it appears on
```

## Rule: Two contexts may define the same word, and neither wins

```gherkin
Example: Both definitions are reachable and each says whose it is
  Given ticketing and billing each define Settlement in their own glossary
  When a reader opens the glossary
  Then Settlement is listed twice
  And one says ticketing and the other says billing
  And each opens its own entry

Example: A context's own term is the one its pages link to
  Given ticketing and billing each define Settlement
  And a ticketing feature lists settlement in its terms
  When a reader follows settlement from that feature
  Then ticketing's Settlement opens

Example: A term only the book defines is used by every context
  Given the book's glossary defines Waiver and no context redefines it
  And an enforcement feature lists waiver in its terms
  When a reader follows waiver from that feature
  Then the book's Waiver opens
  And it says it is the book's, not a context's
```

## Rule: A deprecated term is still readable, and says it is deprecated

```gherkin
Example: The status is on the entry and in the list
  Given a term Reservation with status deprecated
  When a reader opens the glossary
  Then Reservation is listed
  And it is marked deprecated there and on its own entry

Example: A draft term is marked the same way
  Given a term Rule with status draft
  When a reader opens the glossary
  Then Rule is marked draft
```

## Rule: The list narrows as you type

```gherkin
Example: Typing filters the glossary down
  Given a glossary holding eighteen terms
  When a reader types sett into the filter
  Then only the terms whose name or aliases hold sett are listed

Example: An alias narrows to the term it belongs to
  Given a term Debt record whose aliases include TDR
  When a reader types tdr into the filter
  Then Debt record is listed

Example: A filter that matches nothing says what to try
  Given a glossary holding eighteen terms
  When a reader types customer into the filter
  Then it reads: no term here is called "customer" — search the whole book to find where the word is used
```

## Open Questions

None.
