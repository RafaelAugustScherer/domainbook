---
id: export-the-model-as-json
name: Export the model as JSON
status: ready
owners: [RafaelAugustScherer]
terms: [book, artifact]
decisions: [format/ADR-0001]
---

## Story

As a tool that wants the whole book as data
I want one JSON document typed by a published schema
So that I read the book without parsing markdown, and I can check what I read against the schema

## Rule: export json writes the whole model as one document

```gherkin
Example: Every artifact type is present in the document
  Given a book with a roadmap, one domain, a glossary, one feature, two decisions and one debt record
  When domainbook export json runs
  Then it writes domainbook/build/json/book.json
  And that document holds the roadmap, the domain, the glossary, the feature, both decisions and the debt record
```

## Rule: The document conforms to a published JSON Schema

```gherkin
Example: The export validates against the schema it ships with
  Given a book that validates
  When domainbook export json runs
  Then domainbook/build/json/book.json validates against the model JSON Schema
  And that schema is a draft 2020-12 schema generated from zod and committed, the way every other domainbook schema is
```

## Rule: A reference is resolved to what it points at, not left as a bare string

```gherkin
Example: A feature's terms and decisions point at entries in the same document
  Given a feature that lists the term settlement and the decision billing/ADR-0002
  When domainbook export json runs
  Then the feature in book.json links settlement to the glossary entry present in the document
  And it links billing/ADR-0002 to the decision present in the document
```

## Rule: A book that holds little still writes a document the schema accepts

```gherkin
Example: A book with only a roadmap writes empty collections, not missing ones
  Given a book written by domainbook init, before any domain is added
  When domainbook export json runs
  Then book.json holds an empty list of domains and an empty list of decisions
  And it validates against the model JSON Schema
```

## Open Questions

None.
