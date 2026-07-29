---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Formalize the roadmap artifact

## Context and Problem Statement

`roadmap.md` was written before there was a schema for it — it was the prototype
that showed what "machine-readable index in frontmatter, prose in the body" would
look like. Phase 0 had to decide whether it stays an untyped exception or becomes
an artifact like the rest. Leaving it untyped in a book that validates everything
else is the kind of exception that becomes permanent.

## Decision Drivers

- The roadmap is where a reader looks first, so a milestone status that has gone
  stale is the most visible way the book can lie.
- Anything typed can be shown on the site and answered over MCP.
- A schema for something as open-ended as a plan can easily demand fields nobody
  can honestly fill.

## Considered Options

- A minimal schema: `id`, and `milestones` of `{ id, name, status }`.
- No schema: keep the roadmap as prose with unvalidated frontmatter.
- A rich schema: dates, owners, linked domains and decisions per milestone.

## Decision Outcome

Chosen option: "A minimal schema". `status` is one of `planned`, `in-progress`,
`done` — three values a maintainer can always answer honestly. Dates and owners
were left out because a plan that promises a date is a plan that is wrong on a
schedule, and the roadmap's body already carries whatever detail a milestone
needs.

### Consequences

- Good, because milestone status is queryable, and a milestone that ships makes
  the frontmatter wrong until someone fixes it — which is the point.
- Good, because the book's first artifact is now an artifact, with no exception
  to explain.
- Bad, because three statuses cannot express blocked, abandoned, or partially
  shipped; those live in prose and a tool cannot see them.
- Bad, because nothing links a milestone to the work that completes it, so
  "which decisions came out of Phase 0" is a question the body answers and the
  model does not.

### Confirmation

This book's `roadmap.md` validates against the schema, and the fixture book
carries a second roadmap with all three statuses in use.
