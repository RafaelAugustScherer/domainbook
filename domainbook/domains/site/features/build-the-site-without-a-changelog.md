---
id: build-the-site-without-a-changelog
name: Build the site without a changelog
status: ready
owners: [RafaelAugustScherer]
terms: [book, domain, artifact]
decisions: [ADR-0017]
---

## Story

As someone reading a book on its published site
I want the site to show only what the book holds
So that I never land on a changelog page that nobody keeps

## Rule: The site has no changelog pages

```gherkin
Example: The build writes no changelog route
  Given a valid book with a ticketing domain
  When domainbook build runs
  Then domainbook/build/site/changelog does not exist
  And domainbook/build/site/domains/ticketing/changelog does not exist

Example: The navigation has no changelog link
  Given a valid book
  When a reader opens any page of the site
  Then the navigation offers no link named Changelog

Example: A domain page has no section on what changed
  Given a valid book with a ticketing domain
  When a reader opens the ticketing page
  Then it has no section headed: What has changed in ticketing
```

## Rule: Search finds no changelog

```gherkin
Example: No search result is a changelog
  Given a valid book whose features and decisions mention "hold"
  When a reader searches the site for "hold"
  Then no result is a changelog
```

## Open Questions

None.
