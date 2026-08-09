---
id: decide-what-earns-a-record
name: Decide what earns a record
status: implemented
owners: [RafaelAugustScherer]
terms: [skill, decision, feature]
decisions: [ADR-0013, format/ADR-0004, format/ADR-0019]
---

## Story

As an agent about to write a choice down
I want the bar applied before the record exists
So that the log holds decisions with a cost, and not a diary of the work

## Rule: The skill turns away a choice a user can observe and names the feature for it

```gherkin
Example: What a command prints is behaviour
  Given an agent asking to record that validate prints one issue per mistake
  When the record-a-decision skill runs
  Then it writes no decision
  And it names the feature whose scenarios say what validate prints

Example: What a generator writes is behaviour
  Given an agent asking to record that new domain scaffolds a glossary as well as a canvas
  Then the skill writes no decision
  And it offers to write the example into the scaffold feature instead

Example: The refusal says where the knowledge goes, not only that it was refused
  Given any choice the skill turns away as behaviour
  Then it names the file the scenario belongs in
```

## Rule: The skill records a choice only when reversing it would cost something

```gherkin
Example: Internal structure is its own record
  Given an agent asking to record that the loader keeps one file per artifact type
  Then the skill writes no decision
  And it says the code is the record and a refactor can undo it

Example: A choice with a cost to reverse earns one
  Given an agent asking to record taking a dependency on a gherkin parser
  Then the skill writes the record
  And the record names what reversing it would cost

Example: A choice about how the work is done is working practice
  Given an agent asking to record that a phase starts with its scenarios
  Then the skill writes no decision
  And it names CONTRIBUTING.md as where working practice belongs
```

## Rule: Whether a person weighed the choice is asked, never assumed

```gherkin
Example: The question comes before the frontmatter is written
  Given a choice that earns a record
  When the skill runs
  Then it asks whether the people it is about to name in decision-makers weighed this choice

Example: A choice the agent made alone is marked
  Given the answer that nobody weighed it
  Then the record carries authored-by: agent
  And decision-makers still names the people who are accountable for it

Example: A choice made inside what a person asked for is not marked
  Given the answer that the person asked for the work and the agent chose within it
  Then the record carries no authored-by key

Example: An unanswered question takes the reading that claims less
  Given the question was asked and not answered
  Then the record carries authored-by: agent
  And the skill says it assumed nobody weighed it
```

## Rule: The record names the options that were actually weighed

```gherkin
Example: One option is not a decision
  Given a choice for which no alternative was considered
  Then the skill asks what else was on the table
  And it writes no Considered Options holding a single entry

Example: An option nobody weighed is not invented to fill the section
  Given two options were weighed
  Then Considered Options holds those two and no third
```

## Rule: The skill supersedes through the tool and never edits an accepted record by hand

```gherkin
Example: Changing course goes through new decision --supersedes
  Given ADR-0004 is accepted and the choice has changed
  Then the skill runs domainbook new decision --supersedes 4
  And it does not edit ADR-0004's Decision Outcome itself

Example: A record retired for failing the bar is deprecated, not deleted
  Given an accepted record the bar now reads as working practice
  Then the skill sets its status to deprecated
  And it writes the dated act in the changelog
  And the choice itself is moved to CONTRIBUTING.md rather than lost
```

## Rule: The skill decides whether the choice is one context's or the book's

```gherkin
Example: A choice inside one context is that context's record
  Given a choice about how the ticketing loader reads a file
  Then the skill writes it under domains/ticketing/decisions/

Example: A choice that spans contexts is the book's record
  Given a choice about which package boundary owns validation
  Then the skill writes it under decisions/ at the book root
```

## Open Questions

None.
