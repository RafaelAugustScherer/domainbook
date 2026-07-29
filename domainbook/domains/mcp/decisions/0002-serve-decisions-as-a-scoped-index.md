---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Serve decisions as a scoped index

## Context and Problem Statement

A book that lives long enough accumulates decisions faster than anything else in
it: one root log plus one per domain, each numbered forever, nothing deleted. An
agent starting a task wants to know what has already been decided, and the
cheapest thing it can do is read the folder.

At ten decisions that works. At a hundred it fills the session with records that
have nothing to do with the change in front of it, crowds out the code the agent
came to read, and hands the model a hundred plausible statements to blend — the
condition under which a confident wrong answer gets produced. Nothing this server
does can stop a client globbing `decisions/*.md`. What it can do is make the
served path so much cheaper that the glob is the worse option.

## Decision Drivers

- The number of decisions in a book only grows; the number that bear on one
  change does not.
- This context is search-first by rule — find, then fetch by id — and a getter
  that hands back a whole log is the exception that breaks it.
- The book already knows which decisions are dead — MADR `status`, required and
  closed by `format/ADR-0004` — and which context owns a path, through the domain
  `code:` globs. Scoping needs no new field.
- Enforcement already owns path matching, and `where_to_document` already runs
  it. A second matcher here would be a second answer to the same question.

## Considered Options

- Return whole records for whatever is asked, and let paging handle the size.
- Return a scoped index by default; full bodies by id.
- Leave retrieval unscoped and use the instruction layer to ask agents to be
  narrow.

## Decision Outcome

Chosen option: "a scoped index by default". Paging does not help — an agent that
asks for everything pages through everything. Instructions are steering, and this
is a place where the mechanism is available, so it is used. Five rules:

1. `get_decisions` answers with an index: title, status, date, domain, and the
   one-line decision outcome, per record. Full bodies come back only when asked
   for by id. A hundred-record index is a few hundred tokens; a hundred bodies is
   a session.
2. It is scoped by default — to a domain, or to a set of changed paths matched by
   enforcement's matcher, the same one `where_to_document` calls. Asking for the
   whole log is possible and has to be said out loud.
3. Superseded and rejected records are excluded by default from every retrieval
   path — index, search, and resources alike. A superseded record stays reachable
   by id and through the supersede phrase of the record that replaced it.
4. The path-scoped `.claude/rules/` files generated in Phase 2 carry pointers, not
   content: which context owns this path and how to ask the book about it, never
   a copy of what the book says. A generated copy is a second source that goes
   stale silently.
5. The generated `AGENTS.md` section tells agents to query the book rather than
   read it file by file. That is steering, not a guarantee — the same split
   `enforcement/ADR-0001` draws, and it is named here so nobody reads rule 5 as a
   promise.

The one-line outcome in the index is the first sentence of the record's Decision
Outcome section. It is written by the author of the decision, not produced by a
summarizer at serve time: a derived summary that can drift is worse than no
summary, and MADR already asks the author for exactly this sentence.

### Consequences

- Good, because the default answer stays roughly flat as a log grows: the index
  is small per record, and superseding a record removes it from the default set.
- Good, because status stops being bookkeeping. Marking a record superseded pays
  back immediately in what agents see, which is the only reliable way to keep a
  lifecycle field honest.
- Good, because scoping by changed paths reuses one matcher, so the decisions
  surfaced for a diff, the files named by `where_to_document`, and the files
  demanded by the git hook cannot disagree.
- Bad, because the index is a derived view of a body nobody checks against it.
  An author whose opening sentence says "Chosen option: option 2" degrades every
  future index entry, and no schema can catch it — it is a review matter, like
  the immutability rule in `format/ADR-0004`.
- Bad, because excluding superseded records by default hides the history that
  explains why a live decision looks strange. It is one hop away, through the
  chain, but the default answer does not tell that story.
- Bad, because `llms-full.txt` is by definition the whole book in one file and
  ships in the same phase (`domainbook export llms`). It stays — pasting a book
  into a context window or feeding a tool that speaks no MCP is a real need — but
  it is an export a person asks for, not a retrieval path this server offers.
- Bad, because none of this prevents an agent reading `decisions/` off disk. The
  rules make that unattractive; they do not make it impossible, and no version of
  this server can.

### Confirmation

The Phase 3 exit test grows a case with a log big enough to matter: for a set of
changed paths, `get_decisions` returns only the owning domain's live records as
an index, the response size is a small fraction of the log on disk, and the
whole-log answer requires an explicit argument. A record marked superseded
disappears from that answer without being deleted.

## More Information

The transport and SDK this runs on are `mcp/ADR-0001`. The status set that makes
rule 3 possible is `format/ADR-0004`; the reference syntax the supersede phrase
uses is `format/ADR-0005`. The steering-versus-enforcement split rule 5 leans on
is `enforcement/ADR-0001`.
