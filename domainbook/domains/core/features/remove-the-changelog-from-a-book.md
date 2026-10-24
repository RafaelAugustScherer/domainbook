---
id: remove-the-changelog-from-a-book
name: Remove the changelog from a book
status: ready
owners: [RafaelAugustScherer]
terms: [book, book-root, domain, artifact]
decisions: [ADR-0017]
---

## Story

As a maintainer of a book written before domainbook dropped the changelog
I want validate to tell me the changelog no longer belongs there, and to remove it when I ask
So that no stale file sits in the book looking like documentation someone keeps

## Rule: A book holds no changelog, and validate says so

```gherkin
Example: A changelog at the book root is refused, and the fix is named
  Given a valid book at domainbook that also holds domainbook/changelog.md
  When domainbook validate runs
  Then it reports domainbook/changelog.md: a book holds no changelog — run "domainbook validate --fix" to delete it, or move it out of domainbook/ if the project keeps one
  And it exits 1

Example: A changelog in a domain is refused the same way
  Given a valid book whose ticketing domain also holds domainbook/domains/ticketing/changelog.md
  When domainbook validate runs
  Then it reports domainbook/domains/ticketing/changelog.md: a book holds no changelog — run "domainbook validate --fix" to delete it, or move it out of domainbook/ if the project keeps one
  And it exits 1

Example: A changelog outside the book is the project's own
  Given a valid book at domainbook
  And the repo holds CHANGELOG.md at its root and packages/core/CHANGELOG.md
  When domainbook validate runs
  Then it prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
  And CHANGELOG.md and packages/core/CHANGELOG.md are still there
```

## Rule: validate --fix deletes the book's changelogs and nothing else

```gherkin
Example: --fix deletes every book changelog, and the book then validates
  Given a valid book holding domainbook/changelog.md and domainbook/domains/ticketing/changelog.md
  When domainbook validate --fix runs
  Then it prints: deleted domainbook/changelog.md
  And it prints: deleted domainbook/domains/ticketing/changelog.md
  And it prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
  And it exits 0
  And neither file exists

Example: --fix leaves every other issue for the author
  Given a book holding domainbook/changelog.md and a feature whose status is "finished"
  When domainbook validate --fix runs
  Then it prints: deleted domainbook/changelog.md
  And it reports the feature's status, as validate does
  And it exits 1
  And the feature file is unchanged

Example: --fix on a book with no changelog changes nothing
  Given a valid book holding no changelog
  When domainbook validate --fix runs
  Then it prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
  And no file in the book has changed

Example: Without --fix, validate deletes nothing
  Given a valid book that also holds domainbook/changelog.md
  When domainbook validate runs
  Then domainbook/changelog.md is still there
```

## Rule: Nothing domainbook writes is a changelog

```gherkin
Example: init writes a roadmap, a glossary and a config, and no changelog
  Given a repo with no book
  When domainbook init runs
  Then it prints: wrote domainbook/roadmap.md, domainbook/glossary.md, domainbook/domainbook.config.yaml and .mcp.json
  And domainbook/changelog.md does not exist

Example: new domain writes the canvas, the glossary and the three logs, and no changelog
  Given a book written by domainbook init
  When domainbook new domain ticketing runs
  Then domainbook/domains/ticketing/changelog.md does not exist
  And domainbook validate prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records

Example: The JSON export holds no changelog
  Given a valid book with one domain
  When domainbook export json runs
  Then the exported book has no changelog field
  And no exported domain has a changelog field
  And the published model schema defines no changelog
```

## Open Questions

None.
