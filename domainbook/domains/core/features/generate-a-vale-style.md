---
id: generate-a-vale-style
name: Generate a Vale style
status: ready
owners: [RafaelAugustScherer]
terms: [ubiquitous-language]
---

## Story

As a writer who wants prose to use the team's words
I want a Vale style built from the glossary
So that "user" is flagged where the book says "member", from the aliases the glossary already lists

## Rule: A term with aliases becomes a rule that flags the synonym and suggests the term

```gherkin
Example: An alias is turned into a substitution
  Given a Member term whose aliases list "user" and "customer"
  When domainbook export vale runs
  Then domainbook/build/vale/domainbook/ holds a rule that flags "user" and "customer"
  And that rule suggests "member" in their place
  And it flags at the warning level

Example: The style is named domainbook wherever the book lives
  Given a book at docs/book whose glossary holds an aliased term
  When domainbook export vale docs/book runs
  Then it writes the style to docs/book/build/vale/domainbook/
  And the style folder is named domainbook whatever the book root is called
```

## Rule: The style loads in Vale

```gherkin
Example: A Vale run reads the generated style without error
  Given a glossary with at least one aliased term
  When domainbook export vale runs
  Then the folder domainbook/build/vale/domainbook/ loads as a Vale style
  And Vale pointed at a line reading "the user holds a seat" reports the member rule
```

## Rule: The style is generated; where Vale looks for prose stays the repo's own config

```gherkin
Example: The export writes the style and names what the repo still wires
  Given a book with an aliased term
  When domainbook export vale runs
  Then it prints that it wrote the style to domainbook/build/vale/domainbook/
  And it names that a .vale.ini deciding which files to lint is the repo's to write
```

## Rule: A glossary with no aliases writes a style with no rules, and says so

```gherkin
Example: Nothing to flag is reported rather than written empty and silent
  Given a glossary whose terms carry no aliases
  When domainbook export vale runs
  Then domainbook/build/vale/domainbook/ holds no substitution rule
  And it prints: no aliases in the glossary — the style flags nothing yet
```

## Open Questions

None.
