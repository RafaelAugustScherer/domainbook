---
id: export-features-as-gherkin
name: Export features as Gherkin
status: ready
owners: [RafaelAugustScherer]
terms: [feature, rule]
decisions: [format/ADR-0008, core/ADR-0004]
---

## Story

As someone who wants to run the book's scenarios in a test tool
I want the fenced examples as real .feature files
So that Cucumber runs the behaviour the book already describes, without me retyping it

## Rule: Each feature becomes one .feature file under its domain

```gherkin
Example: A feature is written where its domain holds it
  Given a ticketing feature hold-a-seat
  When domainbook export gherkin runs
  Then it writes domainbook/build/gherkin/ticketing/hold-a-seat.feature
  And that file opens with the line: Feature: Hold a seat
```

## Rule: A rule heading becomes a Rule, and each example a scenario under it

```gherkin
Example: The markdown structure survives into the .feature file
  Given a feature with one rule that carries two examples
  When domainbook export gherkin runs
  Then the .feature file holds one Rule taken from that heading
  And it holds two scenarios, one per example, nested under that Rule
```

## Rule: The story becomes the feature's description

```gherkin
Example: The As / I want / So that lines sit under the Feature keyword
  Given a feature whose story begins "As an agent that has just changed a repo"
  When domainbook export gherkin runs
  Then the three story lines appear as the description below Feature, above the first Rule
```

## Rule: What the book pins to parse the blocks is what the export writes

```gherkin
Example: Every exported file parses with the parser the book already pins
  Given a book whose features all validate
  When domainbook export gherkin runs
  Then every file under domainbook/build/gherkin/ parses with the pinned Gherkin parser
  And the scenarios in it are the examples the book carries, unchanged
```

## Rule: A feature carrying no fenced example writes no file

```gherkin
Example: A rule described only in prose exports nothing for that feature
  Given a feature whose rules hold no gherkin blocks
  When domainbook export gherkin runs
  Then no .feature file is written for that feature
  And the run names it among the features it wrote nothing for
```

## Open Questions

None.
