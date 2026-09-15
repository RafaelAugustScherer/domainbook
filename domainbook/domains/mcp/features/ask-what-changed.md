---
id: ask-what-changed
name: Ask what changed
status: implemented
owners: [RafaelAugustScherer]
terms: [book, domain, artifact]
decisions: [mcp/ADR-0003, mcp/ADR-0002, ADR-0006]
---

## Story

As an agent picking up a repo I last worked in a month ago
I want what moved in the context I am about to touch, newest first
So that I build on what the code does now rather than on what I remember it doing

## Rule: The answer is bounded by release, not by a count of entries

```gherkin
Example: The newest release in scope comes back, with anything unreleased
  Given a ticketing changelog holding [Unreleased] and the releases 2.3.0, 2.2.0 and 2.1.0
  When the client calls get_changelog with domain "ticketing"
  Then the answer holds [Unreleased] and 2.3.0
  And it holds neither 2.2.0 nor 2.1.0
  And it names 2.2.0 as the release before, so the caller knows what to ask for next

Example: A named version reaches an older release whole
  Given a ticketing changelog holding the releases 2.3.0, 2.2.0 and 2.1.0
  When the client calls get_changelog with domain "ticketing" and version "2.2.0"
  Then the answer holds 2.2.0 in full
  And it holds no other release

Example: A date bound reaches every release since it
  Given a ticketing changelog whose 2.3.0 is dated 2026-07-30, 2.2.0 is dated 2026-06-02 and 2.1.0 is dated 2026-04-11
  When the client calls get_changelog with domain "ticketing" and since "2026-05-01"
  Then the answer holds [Unreleased], 2.3.0 and 2.2.0
  And it does not hold 2.1.0

Example: A release is never cut in half to fit
  Given a ticketing changelog whose 2.3.0 holds forty entries
  When the client calls get_changelog with domain "ticketing"
  Then the answer holds all forty
  And no entry is dropped or shortened

Example: A version that is not in the changelog is answered with the ones that are
  Given a ticketing changelog holding the releases 2.3.0, 2.2.0 and 2.1.0
  When the client calls get_changelog with domain "ticketing" and version "9.9.9"
  Then it answers with: no 9.9.9 in domainbook/domains/ticketing/changelog.md — it holds 2.3.0, 2.2.0 and 2.1.0
```

## Rule: The answer is scoped, and the whole book has to be asked for out loud

```gherkin
Example: Scoping by changed paths answers with the owning context's changelog
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And both domains keep a changelog
  When the client calls get_changelog with paths ["src/ticketing/hold.ts"]
  Then the answer holds the ticketing changelog
  And it does not hold the billing changelog

Example: The book's own changelog is not in a path-scoped answer
  Given a book whose ticketing domain claims src/ticketing/** and whose root changelog holds [Unreleased]
  When the client calls get_changelog with paths ["src/ticketing/hold.ts"]
  Then the answer holds the ticketing changelog
  And it does not hold domainbook/changelog.md

Example: A folder is scope enough, and does not have to be a file inside it
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls get_changelog with paths ["src/ticketing"]
  Then the answer holds the ticketing changelog

Example: Paths no domain claims are said to claim nothing
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls get_changelog with paths ["README.md"]
  Then it answers with: no domain claims those paths — name a domain instead, or pass all to read the whole book

Example: A domain-scoped answer is that domain's changelog and nothing else
  Given a book whose ticketing domain keeps a changelog and whose root changelog holds [Unreleased]
  When the client calls get_changelog with domain "ticketing"
  Then the answer holds domainbook/domains/ticketing/changelog.md
  And it does not hold domainbook/changelog.md

Example: A call with no scope is refused rather than answered with everything
  Given a book holding four domains, each keeping a changelog
  When the client calls get_changelog with no domain and no paths
  Then it answers with: name a domain or the paths you are changing — or pass all to read every changelog in the book

Example: A domain that keeps no changelog says so
  Given a book whose reporting domain keeps no changelog
  When the client calls get_changelog with domain "reporting"
  Then it answers with: reporting keeps no changelog — domainbook/changelog.md is the one this book has
```

## Rule: Entries come back as they were written

```gherkin
Example: An entry is returned word for word, under the bucket it was written in
  Given a ticketing changelog whose 2.3.0 Added holds "Holds expire ten minutes after they are placed (`ticketing/ADR-0009`)."
  When the client calls get_changelog with domain "ticketing"
  Then that entry reads: Holds expire ten minutes after they are placed (`ticketing/ADR-0009`).
  And it sits under Added

Example: Nothing is summarized, shortened or merged
  Given a ticketing changelog whose 2.3.0 holds four entries under Added and two under Fixed
  When the client calls get_changelog with domain "ticketing"
  Then the answer holds six entries
  And the buckets they were written under are the buckets they come back under

Example: A yanked release says it was yanked
  Given a ticketing changelog whose 2.3.0 is marked yanked
  When the client calls get_changelog with domain "ticketing" and version "2.3.0"
  Then the answer says 2.3.0 was yanked
```

## Rule: A book that cuts no releases gets one unbounded section, and that is the accepted cost

```gherkin
Example: Everything in Unreleased comes back as one section
  Given a ticketing changelog holding [Unreleased] with sixty entries and no release
  When the client calls get_changelog with domain "ticketing"
  Then the answer holds all sixty
  And it says this changelog has no releases, so bounding by release bounds nothing
  And it names mcp/ADR-0003, where that cost was weighed and kept
```

## Open Questions

None.
