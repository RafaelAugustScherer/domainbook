# Glossary

The words domainbook uses about itself. A term is here because the repo already
uses it and a reader could reasonably read it two ways — not because a dictionary
would like it.

## Artifact

One file in the book of a type the format knows: roadmap, domain page, glossary,
feature, decision, or changelog. An artifact is documentation, never a build
output — nothing this project produces from a build is called an artifact.

- **Aliases:** book file
- **Status:** validated
- **Example:** `domains/format/index.md` is a domain artifact; `packages/core/dist/index.js` is not an artifact at all.

## Book

The folder of artifacts that documents one repo. There is one book per repo, and
domainbook the tool reads it, checks it, serves it, and publishes it.

- **Status:** validated
- **Example:** This repo's book is `domainbook/`; the fixture book under `packages/core/test/fixtures/book/` is a second, complete book used by tests.

## Book root

The folder a book starts at, `domainbook/` by default. The root is an argument to
the tool, not a setting inside the book — a book cannot say where it lives,
because you have to have found it before you can read it.

- **Status:** validated
- **Example:** Config lives at `<book-root>/domainbook.config.yaml` and carries no `root` key.

## Canvas

The Bounded Context Canvas V5, the structure a domain page follows. Name and
Strategic Classification live in the page's frontmatter, Ubiquitous Language
lives in the domain's own glossary, and the remaining eight sections are the
body, in canvas order.

- **Status:** validated
- **Example:** Reading a domain page top to bottom gives Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics, Open Questions.

## Decision

A recorded choice with its context, the options weighed, and what it costs —
MADR 4.0 in a file under `decisions/`. Written as ADR when referring to one by
number.

- **Aliases:** ADR, architecture decision record
- **Status:** validated
- **Example:** `format/ADR-0004` and "the MADR-narrowing decision" name the same file.

## Domain

One bounded context: a folder under `domains/` with a canvas, and optionally its
own glossary, changelog, features, and decisions. The `classification.domain`
frontmatter field is a different thing — it names the subdomain type (core,
supporting, generic), not the domain itself.

- **Aliases:** bounded context, context
- **Status:** validated
- **Example:** `enforcement` is a domain whose `classification.domain` is `core-domain`.

## Enforcement loop

The three checks that make a documentation rule a guarantee: an agent hook during
the session, a git hook at commit, and CI on the branch. All three run the same
check and reach the same verdict.

- **Status:** validated
- **Example:** An agent that ignores the Stop hook still meets the git hook, and a developer who skips the git hook still meets CI.

## Feature

An artifact describing behaviour as a story, rules, and concrete examples —
Example Mapping in markdown, with Gherkin in fenced blocks. A feature holds
scenarios; a scenario on its own is a Gherkin keyword, not an artifact.

- **Aliases:** feature scenario
- **Status:** validated
- **Example:** `domains/core/features/validate-a-book.md` is one feature carrying four rules and six examples.

## Golden fixture

A book, or a single artifact, kept in the repo for tests to run against — valid
on purpose or broken on purpose, and named after the reason it exists.
`packages/core/test/fixtures/book/` is one book valid in every respect. Under
`broken-books/`, each folder is a whole book invalid in exactly one respect;
under `valid-books/`, each folder is a whole book that must load clean, kept for
a rule only a legal book can prove. Under `broken/`, each file is one artifact
rather than a book, read by a single schema or a single body parser.

- **Aliases:** fixture book
- **Status:** validated
- **Example:** `broken-books/decision-number-gap/` proves a log holding 0001 and 0003 reports the missing 0002, `valid-books/mirrored-relationship/` proves two agreeing halves of one relationship are legal, and `broken/domain-symmetric-with-direction.md` proves `separate-ways` with a `direction` is rejected.

## Instruction layer

The generated text that tells an agent the documentation rule — an AGENTS.md
section, a CLAUDE.md include, path-scoped rules. It is steering, not enforcement:
nothing about it can block a change, and it is not one of the enforcement loop's
three layers.

- **Status:** validated
- **Example:** An agent that ignores its AGENTS.md still gets blocked by the git hook, which is the point of keeping the two separate.

## Issue

One thing wrong with a book, in the shape `validate` reports it: a file, often a
line and a field, and a message naming the fix. One mistake produces one issue,
not one per consequence of it, and every issue is a failure — there is no
warning level to fall back on.

- **Status:** validated
- **Example:** `domainbook/domains/core/index.md:2 id: "cor" does not match the folder "core" — rename the folder to "cor" or set id to "core"` is one issue as a terminal sees it.

## Rule

A statement in a feature that is always true, written as a `## Rule: …` heading
with its examples under it — the Example Mapping sense of the word. The same
word is used for what `validate` enforces about the format itself: canvas order,
ADR numbering, gherkin that parses. Those are rules of the format; a feature's
rule is about the software the book documents.

- **Status:** draft
- **Example:** "Rule: A hold expires ten minutes after it is placed" is a feature's rule; "a decision log runs from 0001 with no gaps" is a rule of the format.

## Self-documentation

domainbook documenting domainbook with domainbook's own format. Every claim in
this book is a claim the project has to keep true about itself.

- **Status:** validated
- **Example:** The four contexts under `domains/` describe the packages that implement them, and the enforcement loop will one day block a change to those packages that leaves these pages stale.

## Slug

A lowercase identifier made of words joined by single hyphens. Every id in the
book is a slug, and a glossary term is referenced by the slug of its name.

Slugging folds a name to NFKD and drops the combining marks, so an accented
letter becomes the letter underneath it. Everything that is then not `a-z0-9`
becomes a hyphen. A name written in a script that leaves nothing behind — most
of the world's, outside Latin — slugs to the empty string, and the tool says so
rather than pretending the name was badly written.

- **Status:** validated
- **Example:** The term "Seat Map" is referenced as `seat-map`, "Café Order" as `cafe-order`, and "Naïve résumé" as `naive-resume`; "日本語" slugs to nothing at all.

## Trailer

A `Key: value` line at the end of a git commit message, the same convention as
`Signed-off-by:`. domainbook records waivers there because git parses them,
history keeps them, and nothing outside the commit has to be trusted.

- **Aliases:** commit trailer
- **Status:** validated
- **Example:** `git log --format='%(trailers:key=Skip-Docs,valueonly)'` lists every waived commit and its reason.

## Ubiquitous language

The vocabulary one bounded context agrees on, and the thing a glossary artifact
holds. It is a canvas section that lives outside the canvas body — a domain's
language is its `glossary.md`, so it can be exported, searched, and referenced
term by term.

- **Status:** validated
- **Example:** Two contexts that use "sale" differently each define it in their own glossary, and neither has to win.

## Waiver

A recorded, deliberate decision to change mapped code without updating the book.
A waiver is not a bypass: it is the audited alternative to updating the book, and
it stays in history either way.

- **Status:** validated
- **Example:** `Skip-Docs: renamed a private helper, no behaviour or vocabulary changed` is a waiver; `git commit --no-verify` is not one.
