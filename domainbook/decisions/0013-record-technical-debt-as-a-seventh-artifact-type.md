---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Record technical debt as a seventh artifact type

## Context and Problem Statement

The between-phases review closed with a list of "fix later" findings, and the
only place they landed was a PR body — outside the book, outside the repo's
files, invisible to the next agent. That is exactly the knowledge this tool
exists to keep in the repo, and the book had no artifact to hold it: an ADR's
Consequences record what a decision costs, a canvas's Open Questions hold what
a context does not know, but a known shortcut with a known remedy fits neither.
Where does known debt live, so the next agent can ask "what known debt touches
the code I am about to change?"

## Decision Drivers

- Debt must trace to concrete artifacts — code, a decision — or it is an
  opinion, not a record (the SEI's *Managing Technical Debt*, Kruchten, Nord
  and Ozkaya, 2019).
- Debt has to be aggregatable and queryable: the enforcement loop, the MCP
  server, and the site all want to answer "what is open here", which prose
  buried in other artifacts cannot.
- Every artifact type so far adopts an existing versioned standard — the
  "standards all the way down" principle. The book already carries one
  invented format (the roadmap, `format/ADR-0009`); each further invention
  weakens that pitch.
- There is no standard to adopt: the ADR templates catalog at adr.github.io
  lists no debt template, and the MADR repository has no issue even discussing
  technical debt.

## Considered Options

- A `debt/` log derived from Michael Stal's Technical Debt Records template,
  narrowed to domainbook size.
- Convention only: record debt in ADR Consequences and canvas Open Questions.
- Adopt Stal's template wholesale, all seventeen fields.
- Track debt as GitHub issues.

## Decision Outcome

Chosen option: a `debt/` log derived from Stal's template. Technical debt
becomes the seventh artifact type: `debt/NNNN-<slug>.md` at the book root and
per domain, the decision log's twin — 4-digit sequential numbers never reused,
referenced as `TDR-NNNN` and qualified as `<domain-id>/TDR-NNNN` across logs,
the `format/ADR-0005` rule applied unchanged.

No adopted standard exists, so this format is *derived from* a template, not
conformant to a maintained spec. The source is Michael Stal's
[Technical Debt Records](https://github.com/ms1963/TechnicalDebtRecords) (MIT,
created September 2024, dormant since November 2024) — the origin of the
concept, and the nearest thing to a convention: the one independent
implementation, `record-tools-rs`, reproduces his fields nearly verbatim.
Patrick Roos's [six-field variant](https://www.workingsoftware.dev/technical-debt-records/)
is the precedent for narrowing, the same move `format/ADR-0004` made on MADR's
frontmatter.

What survives the narrowing: required `status: open | accepted | repaid`,
`date` (when the debt was recorded), `severity: low | medium | high | critical`
(Stal's four levels), and `quadrant: deliberate-prudent | deliberate-reckless |
inadvertent-prudent | inadvertent-reckless` —
[Fowler's Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html),
the citable answer to "how did this happen". Optional: `owners`, `code:` globs
tracing the debt to the code that carries it, and `decisions:` naming the ADR
whose consequences incurred it. The body is three H2s — Debt, Impact, Remedy.
Stal's Cost of Delay and Effort to Resolve fields become prose inside Impact
and Remedy: numbers nobody measures are false precision. Maldonado and
Shihab's five self-admitted-debt types were considered as a `type` field and
left out — quadrant plus severity classifies enough, and a `type` field can be
added compatibly later if querying demands it.

Convention-only was rejected because prose in Consequences and Open Questions
cannot be aggregated or queried — that is precisely the gap the review exposed
when its findings had no home but a PR body. Wholesale adoption was rejected
because seventeen fields is heavyweight for every record, the source is
dormant and unversioned, and its cost fields invite invented numbers.
GitHub issues were rejected because they leave the repo: not git-versioned
with the code they describe, and invisible to the MCP server and the site.

### Consequences

- Good, because debt survives the session that finds it: the next agent asks
  what open debt touches the code it is about to change, and downstream phases
  can build on the record — the staged check warning on matched globs, MCP
  serving debt by scope, the site rendering the register.
- Good, because `code:` globs and `decisions:` references make each record
  traceable — debt that traces to nothing is visible as such.
- Bad, because the book now owns two invented formats — roadmap and debt —
  against five adopted ones. Each invention weakens the "standards all the way
  down" pitch, so this one has to stay minimal.
- Bad, because deriving from a dormant template means no upstream to track:
  freedom to shape the format, and the whole burden of maintaining it.
- Bad, because a debt record is a living record — edited in place, `status`
  flipped to `repaid` or `accepted` — which is the opposite of the accepted-ADR
  immutability rule. Two logs that look alike now follow opposite lifecycles,
  and a reader has to know which one they are in.

### Confirmation

Phase 1.1's exit criterion: this book records the review's leftover findings
as TDRs that `domainbook validate` accepts, and `domainbook new debt` scaffolds
a record that validates as written.

## More Information

This record covers the artifact's existence, its derivation, and the outline
of its shape. The exact zod schema, the reference grammar, and the validation
rules are Phase 1.1 implementation work and will get their own records in the
format domain's log. The roadmap's Phase 1.1 section carries the milestone's
deliverables.
