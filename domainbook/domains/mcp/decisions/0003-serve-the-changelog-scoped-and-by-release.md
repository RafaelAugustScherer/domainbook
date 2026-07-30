---
status: accepted
date: 2026-07-30
decision-makers: [RafaelAugustScherer]
---

# Serve the changelog scoped and by release

## Context and Problem Statement

The Phase 3 tool surface named seven tools — `search_book`, `get_domain`,
`get_context_map`, `explain_terms`, `get_feature`, `get_decisions`, and
`where_to_document` — and no changelog among them. A book carries one changelog
at the root and one per domain, so the artifact is served today only as
full-text hits from `search_book` and as a resource a client may browse.

That is enough to find a phrase and not enough to answer the question a
changelog exists for. "What changed in this context since the version I last
worked against" is a query over releases and scopes, and full-text search has no
notion of either: it matches prose, returns whichever entries share a word, and
gives back no ordering a caller can trust. An agent picking up a repo it has not
touched in a month has no served path to what moved.

Leaving that unstated is the actual problem. Nothing in the book said whether the
omission was a judgment that search suffices or an oversight, so neither
building the tool nor declining to build it could be reviewed.

## Decision Drivers

- A changelog's value is temporal, and every temporal question — since when,
  in what order, in which release — is one search cannot answer.
- The same growth argument as `mcp/ADR-0002`: a changelog only grows, and the
  number of entries bearing on one change does not. The root changelog is
  already 212 lines four releases in.
- Per-domain changelogs exist in the format and are what make a scoped answer
  possible. A tool that can only return the root changelog would leave that half
  of the format unserved.
- This context is search-first by rule — find, then fetch by id. A getter that
  hands back a whole changelog is the exception that breaks it, which is what
  `mcp/ADR-0002` already decided for the decision log.
- The changelog and the decision log answer different halves of one question:
  what changed, and why. Serving one and not the other makes the book look like
  it only records reasoning.

## Considered Options

- `get_changelog`, scoped and paged by release, mirroring `get_decisions`.
- Leave the changelog to `search_book` and to resources.
- Fold changelog entries into `get_decisions`, since most entries reference a
  decision.
- Serve the changelog only through `llms.txt`.

## Decision Outcome

Chosen option: "`get_changelog`, scoped and paged by release", built on the same
three rules `mcp/ADR-0002` set for decisions.

1. **Scoped by default**, to a domain or to a set of changed paths matched by
   enforcement's matcher — the same one `where_to_document` and `get_decisions`
   call. A caller that wants every changelog in the book says so out loud.
2. **Bounded by release, not by entry count.** The default answer is the newest
   release in scope plus `[Unreleased]`; older releases come back when a version
   or a date bound is named. Paging by entry would cut a release in half and
   answer "what changed" with a fragment.
3. **Entries are returned as written**, never summarized at serve time. The same
   reasoning as the one-line outcome in `mcp/ADR-0002`: a derived summary that
   can drift is worse than no summary. This puts real weight on entries staying
   short, which is why the *why* belongs in the decision an entry references
   rather than in the entry.

Folding entries into `get_decisions` was rejected because the two artifacts have
different lifecycles: a decision is immutable once accepted, a released
changelog section is a record of a day. Merging them would make one of the two
lie. Search-and-resources-only was rejected on the temporal argument above.
`llms.txt` was rejected as the sole path for the reason `mcp/ADR-0002` already
gave — it is an export a person asks for, not a retrieval path.

### Consequences

- Good, because "what changed in the code I am about to touch" becomes one call
  with the same scoping as every other tool here, and the per-domain changelog
  stops being a format feature nothing reads.
- Good, because the answer stays roughly flat as a book ages: bounding by release
  means a book with forty releases answers the same size as one with four.
- Bad, because it is the eighth tool on a surface `mcp/ADR-0001` wanted small,
  and every tool added is context spent on every session that never calls it.
- Bad, because release bounding assumes releases are cut. A project that leaves
  everything in `[Unreleased]` — which this book did until 0.1.0 was cut
  retroactively — gets one unbounded section back, and the tool cannot tell that
  from a genuinely small changelog.
- Bad, because scoping by domain inherits the `code:` globs' blind spot: a change
  to a file no glob matches belongs to no context, so it can be recorded in the
  root changelog and never surface in a scoped answer.

### Confirmation

The Phase 3 exit test grows a case: for a set of changed paths, `get_changelog`
returns the owning domain's newest release and `[Unreleased]` and nothing else,
the response is a small fraction of the changelogs on disk, and reaching an
older release requires naming a version or a date. The roadmap's Phase 3 tool
list names it.

## More Information

The scoping rules and the matcher this reuses are `mcp/ADR-0002`; the transport
and SDK are `mcp/ADR-0001`. The changelog format itself is `format/ADR-0003`,
and `ADR-0006` is why the changelog carries what changed while the decision it
references carries why.
