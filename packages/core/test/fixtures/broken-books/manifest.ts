import { fileURLToPath } from "node:url";

export type BrokenBook = { dir: string; rule: string; expect: string };

export const brokenBooksDir = fileURLToPath(new URL("./", import.meta.url));

export const brokenBooks: BrokenBook[] = [
  {
    dir: "roadmap-missing",
    rule: "L2",
    expect:
      'roadmap.md: the book has no roadmap.md — every book needs one; add it with an "id" and a "milestones" list in frontmatter',
  },
  {
    dir: "frontmatter-missing",
    rule: "L3",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md: no frontmatter — a feature needs "id", "name", and "status" in a --- block at the top of the file',
  },
  {
    dir: "frontmatter-empty",
    rule: "L3",
    expect:
      'decisions/0001-store-every-timestamp-in-utc.md:1: frontmatter is empty — a decision needs "status" and "date" between the --- fences',
  },
  {
    dir: "glossary-has-frontmatter",
    rule: "L4",
    expect:
      "domains/ticketing/glossary.md:1: a glossary carries no frontmatter — delete the --- block; a term is an H2 heading with its definition below it",
  },
  {
    dir: "changelog-has-frontmatter",
    rule: "L4",
    expect:
      'domains/ticketing/changelog.md:1: a changelog carries no frontmatter — delete the --- block; a release is an H2 heading like "## [1.2.0] - 2026-06-30"',
  },
  {
    dir: "unknown-file-in-book",
    rule: "L5",
    expect:
      "domains/ticketing/overview.md: the format does not know this file — a domain folder holds index.md, glossary.md, changelog.md, features/*.md, decisions/*.md, and debt/*.md",
  },
  {
    dir: "domains-holds-only-domains",
    rule: "L5",
    expect:
      "domains/readme.md: the format does not know this file — domains/ holds one folder per domain and nothing else",
  },
  {
    dir: "features-holds-only-features",
    rule: "L5",
    expect:
      "domains/ticketing/features/drafts: the format does not know this folder — a features folder holds one .md file per feature and nothing else",
  },
  {
    dir: "decision-log-holds-only-decisions",
    rule: "L5",
    expect:
      "decisions/superseded: the format does not know this folder — a decision log holds .md files and nothing else",
  },
  {
    dir: "feature-file-not-markdown",
    rule: "L5",
    expect:
      "domains/ticketing/features/hold-seats-during-checkout.txt: the format does not know this file — a features folder holds one .md file per feature and nothing else",
  },
  {
    dir: "decision-log-file-not-markdown",
    rule: "L5",
    expect:
      "decisions/0002-refund-a-late-capture-in-full.txt: the format does not know this file — a decision log holds .md files and nothing else",
  },
  {
    dir: "debt-log-file-not-markdown",
    rule: "L5",
    expect:
      "debt/0001-door-scanners-trust-their-own-clock.txt: the format does not know this file — a debt record log holds .md files and nothing else",
  },
  {
    dir: "domain-without-index",
    rule: "L6",
    expect:
      'domains/seating: the domain folder "seating" has no index.md — add one with "id: seating", a "name", and the eight canvas sections',
  },
  {
    dir: "frontmatter-yaml-broken",
    rule: "L7",
    expect:
      "domains/ticketing/index.md:10: frontmatter is not valid YAML — Tabs are not allowed as indentation",
  },
  {
    dir: "config-yaml-broken",
    rule: "L7",
    expect:
      "domainbook.config.yaml:4: the config file is not valid YAML — All mapping items must start at the same column",
  },
  {
    dir: "feature-frontmatter-yaml-broken",
    rule: "L7",
    expect:
      "domains/ticketing/features/hold-seats-during-checkout.md:5: frontmatter is not valid YAML — Flow sequence in block collection must be sufficiently indented and end with a ]",
  },
  {
    dir: "config-mode-unknown",
    rule: "S1",
    expect:
      'domainbook.config.yaml:2 enforcement.mode: must be one of "block", "warn"',
  },
  {
    dir: "config-not-a-block",
    rule: "S1",
    expect: "domainbook.config.yaml:1: must be a block of keys indented below it",
  },
  {
    dir: "frontmatter-not-a-block",
    rule: "S1",
    expect: "roadmap.md:2: must be a block of keys indented below it",
  },
  {
    dir: "feature-without-a-name",
    rule: "S1",
    expect:
      "domains/ticketing/features/hold-seats-during-checkout.md:2 name: is required",
  },
  {
    dir: "relationship-without-direction",
    rule: "S1",
    expect:
      'domains/ticketing/index.md:12 relationships[0].direction: must be "upstream" or "downstream" — "customer-supplier" and "upstream-downstream" need a direction, and "partnership", "shared-kernel", and "separate-ways" take none',
  },
  {
    dir: "domain-id-has-a-capital",
    rule: "S1",
    expect:
      "domains/Ticketing/index.md:2 id: must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals",
  },
  {
    dir: "feature-term-starts-with-a-mark",
    rule: "S1",
    expect:
      "domains/बुकिंग/features/सीट-रोकना.md:6 terms[0]: must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals",
  },
  {
    dir: "milestone-id-numeral-not-a-digit",
    rule: "S1",
    expect:
      "roadmap.md:5 milestones[1].id: must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals",
  },
  {
    dir: "debt-severity-unknown",
    rule: "S1",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:4 severity: must be one of "low", "medium", "high", "critical"',
  },
  {
    dir: "canvas-section-missing",
    rule: "B1",
    expect:
      'domains/ticketing/index.md: the canvas section "Verification Metrics" is missing — a domain page carries all eight: Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics, Open Questions',
  },
  {
    dir: "canvas-section-unknown",
    rule: "B1",
    expect:
      'domains/ticketing/index.md:55: "Ubiquitous Language" is not a canvas section — a domain page carries only Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics, Open Questions',
  },
  {
    dir: "canvas-sections-out-of-order",
    rule: "B1",
    expect:
      'domains/ticketing/index.md:40: canvas sections are out of order — "Business Decisions" comes after "Assumptions"; a domain page carries them in canvas order',
  },
  {
    dir: "domain-page-has-h1",
    rule: "B1",
    expect:
      'domains/ticketing/index.md:13: a domain page carries no H1 — its name is the "name" key in frontmatter, and the body starts at "## Purpose"',
  },
  {
    dir: "glossary-term-unknown-bullet",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:12: the term "Hold" has a bullet that is not "**Aliases:**", "**Status:**", or "**Example:**" — move it into the definition prose',
  },
  {
    dir: "glossary-term-prose-after-bullets",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:14: the term "Hold" has prose after its bullet list — a term is a definition and then one bullet list, with nothing after it',
  },
  {
    dir: "glossary-term-two-bullet-lists",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:16: the term "Hold" has a second bullet list — a term carries at most one, holding "**Aliases:**", "**Status:**", and "**Example:**"',
  },
  {
    dir: "glossary-term-aliases-repeated",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:11: the term "Hold" repeats "**Aliases:**" — a term carries it once, with the aliases comma-separated on that one bullet',
  },
  {
    dir: "glossary-term-status-repeated",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:12: the term "Hold" repeats "**Status:**" — a term carries it once',
  },
  {
    dir: "glossary-term-without-definition",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:14: the term "Hold" has no definition — write one as prose under its heading',
  },
  {
    dir: "glossary-term-example-empty",
    rule: "B2",
    expect:
      "domains/ticketing/glossary.md:12 examples[0]: is empty — write a value, or remove it",
  },
  {
    dir: "glossary-second-h1",
    rule: "B2",
    expect:
      'domains/ticketing/glossary.md:14: "Words the context retired" is not a term — a glossary is an optional H1 title and intro, then one H2 per term',
  },
  {
    dir: "glossary-duplicate-term",
    rule: "B3",
    expect:
      'domains/ticketing/glossary.md:22: "Seat map" and "Seat Map" are both the term "seat-map" — a glossary defines each term once',
  },
  {
    dir: "glossary-terms-both-empty-slug",
    rule: "B3",
    expect:
      'domains/ticketing/glossary.md:13: "○" and "●" both give an empty term slug — a term is linked by its name in letters and digits, and neither name has any',
  },
  {
    dir: "feature-sections-out-of-order",
    rule: "B4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:27: feature sections are out of order — "Rule: Payment captured before the hold expires issues a ticket" comes after "Open Questions"; a feature is Story, then its rules, then Open Questions',
  },
  {
    dir: "feature-section-repeated",
    rule: "B4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:24: the feature section "Rule: A hold expires ten minutes after it is placed" appears twice — a feature is Story, then its rules, then Open Questions',
  },
  {
    dir: "feature-unknown-section",
    rule: "B4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:14: "Background" is not a feature section — a feature is Story, then its rules, then Open Questions',
  },
  {
    dir: "feature-without-story",
    rule: "B4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md: a feature opens with "## Story" — a feature is Story, then its rules, then Open Questions',
  },
  {
    dir: "feature-without-open-questions",
    rule: "B4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md: a feature closes with "## Open Questions" — a feature is Story, then its rules, then Open Questions',
  },
  {
    dir: "gherkin-does-not-parse",
    rule: "B5",
    expect:
      "domains/ticketing/features/hold-seats-during-checkout.md:25: gherkin does not parse — inconsistent cell count within the table",
  },
  {
    dir: "gherkin-documents-nothing",
    rule: "B5",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:25: this gherkin block documents nothing — write "Example: …" with its Given/When/Then steps, or remove the block',
  },
  {
    dir: "gherkin-example-outside-a-rule",
    rule: "B5",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:14: a gherkin example belongs to a rule — move this block under a "## Rule: …" heading',
  },
  {
    dir: "gherkin-docstring-unterminated",
    rule: "B5",
    expect:
      "domains/ticketing/features/hold-seats-during-checkout.md:23: gherkin does not parse — unexpected end of file, expected: #DocStringSeparator, #Other",
  },
  {
    dir: "changelog-release-heading-malformed",
    rule: "B6",
    expect:
      'domains/ticketing/changelog.md:7: "1.2.0 - 2026-06-30" is not a release heading — write "## [1.2.0] - 2026-06-30", with " [YANKED]" appended if the release was pulled',
  },
  {
    dir: "changelog-bucket-outside-a-release",
    rule: "B6",
    expect:
      'domains/ticketing/changelog.md:7: "Added" is not part of a release — a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release',
  },
  {
    dir: "changelog-second-h1",
    rule: "B6",
    expect:
      'domains/ticketing/changelog.md:17: "Before the seat map moved to seating" is a second H1 — a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release',
  },
  {
    dir: "changelog-bucket-repeated",
    rule: "B6",
    expect:
      'domains/ticketing/changelog.md:17: "Added" appears twice in "[1.2.0] - 2026-06-30" — a release holds Added, Changed, Deprecated, Removed, Fixed, Security as H3s, each a bullet list',
  },
  {
    dir: "changelog-version-malformed",
    rule: "B6",
    expect:
      "domains/ticketing/changelog.md:7 releases[0].version: must be a version with no spaces or brackets",
  },
  {
    dir: "changelog-unreleased-bullet-empty",
    rule: "B6",
    expect:
      "domains/ticketing/changelog.md:9 unreleased.added[0]: is empty — write a value, or remove it",
  },
  {
    dir: "changelog-release-bullet-empty",
    rule: "B6",
    expect:
      "domains/ticketing/changelog.md:13 releases[0].fixed[0]: is empty — write a value, or remove it",
  },
  {
    dir: "changelog-without-a-release",
    rule: "B6",
    expect:
      'domains/ticketing/changelog.md:5: "Added" is not part of a release — a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release',
  },
  {
    dir: "changelog-out-of-order",
    rule: "B7",
    expect:
      'domains/ticketing/changelog.md:19: releases are out of order — "[1.1.0] - 2026-05-04" comes after "[1.0.0] - 2026-04-02"; a changelog lists releases newest first',
  },
  {
    dir: "changelog-duplicate-version",
    rule: "B7",
    expect:
      "domains/ticketing/changelog.md:17: version 1.1.0 is released twice — merge the two sections; a version appears once in a changelog",
  },
  {
    dir: "decision-sections-out-of-order",
    rule: "B8",
    expect:
      'decisions/0001-store-every-timestamp-in-utc.md:19: MADR sections are out of order — "Decision Drivers" comes after "Considered Options"; the order is Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Pros and Cons of the Options, More Information',
  },
  {
    dir: "decision-unknown-section",
    rule: "B8",
    expect:
      'decisions/0001-store-every-timestamp-in-utc.md:9: "Status" is not a MADR section — a decision carries only Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Pros and Cons of the Options, and More Information',
  },
  {
    dir: "decision-consequences-missing",
    rule: "B8",
    expect:
      'decisions/0001-store-every-timestamp-in-utc.md: the MADR section "Consequences" is missing — a decision carries Context and Problem Statement, Considered Options, and Decision Outcome with "### Consequences" under it',
  },
  {
    dir: "decision-without-title",
    rule: "B8",
    expect:
      'decisions/0001-store-every-timestamp-in-utc.md:7: a decision opens with its title as an H1 — write "# <the decision>" above "## Context and Problem Statement"',
  },
  {
    dir: "debt-section-missing",
    rule: "B9",
    expect:
      'debt/0001-holds-are-swept-by-hand.md: the debt record section "Remedy" is missing — a debt record carries Debt, Impact, and Remedy',
  },
  {
    dir: "debt-unknown-section",
    rule: "B9",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:25: "Effort" is not a debt record section — a debt record carries only Debt, Impact, and Remedy',
  },
  {
    dir: "debt-section-repeated",
    rule: "B9",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:25: the debt record section "Impact" appears twice — a debt record carries only Debt, Impact, and Remedy',
  },
  {
    dir: "debt-sections-out-of-order",
    rule: "B9",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:20: debt record sections are out of order — "Impact" comes after "Remedy"; the order is Debt, Impact, Remedy',
  },
  {
    dir: "debt-without-title",
    rule: "B9",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:8: a debt record opens with its title as an H1 — write "# <the debt>" above "## Debt"',
  },
  {
    dir: "relationship-names-unknown-domain",
    rule: "R1",
    expect:
      'domains/ticketing/index.md:12 relationships[0].with: no domain "seatting" in this book — domains are seating, ticketing',
  },
  {
    dir: "relationship-with-itself",
    rule: "R2",
    expect:
      'domains/ticketing/index.md:12 relationships[0].with: "ticketing" is this domain — a relationship names another domain',
  },
  {
    dir: "relationship-type-contradicts",
    rule: "R3",
    expect:
      'domains/seating/index.md:13 relationships[0].type: "shared-kernel" contradicts "partnership" declared in domains/ticketing/index.md — mirrored declarations of the same relationship must agree',
  },
  {
    dir: "relationship-direction-contradicts",
    rule: "R3",
    expect:
      'domains/seating/index.md:14 relationships[0].direction: both sides are "downstream" — domains/ticketing/index.md declares the mirror, so one of the two is "upstream"',
  },
  {
    dir: "relationship-direction-both-upstream",
    rule: "R3",
    expect:
      'domains/seating/index.md:14 relationships[0].direction: both sides are "upstream" — domains/ticketing/index.md declares the mirror, so one of the two is "downstream"',
  },
  {
    dir: "feature-term-not-found",
    rule: "R4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:6 terms[1]: no term "queue-position" in domains/ticketing/glossary.md or glossary.md',
  },
  {
    dir: "feature-term-without-a-glossary",
    rule: "R4",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:6 terms[0]: no term "hold" — neither ticketing nor this book has a glossary.md',
  },
  {
    dir: "feature-decision-not-found",
    rule: "R5",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:6 decisions[0]: no decision "ticketing/ADR-0009" — domains/ticketing/decisions/ holds ADR-0001, ADR-0002, and ADR-0003',
  },
  {
    dir: "feature-decision-names-unknown-domain",
    rule: "R5",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:6 decisions[0]: no decision "seating/ADR-0001" — there is no domain "seating" in this book',
  },
  {
    dir: "feature-decision-log-empty",
    rule: "R5",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:6 decisions[0]: no decision "ticketing/ADR-0001" — domains/ticketing/decisions/ is empty',
  },
  {
    dir: "debt-decision-not-found",
    rule: "R5",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:6 decisions[0]: no decision "ADR-0002" — decisions/ holds ADR-0001',
  },
  {
    dir: "domain-debt-decision-not-found",
    rule: "R5",
    expect:
      'domains/ticketing/debt/0001-hold-expiry-is-checked-only-when-a-hold-is-read.md:6 decisions[0]: no decision "ticketing/ADR-0002" — domains/ticketing/decisions/ holds ADR-0001',
  },
  {
    dir: "superseded-by-missing-decision",
    rule: "R6",
    expect:
      'domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md:2 status: "superseded by ticketing/ADR-0004" names no decision — domains/ticketing/decisions/ holds ADR-0001 and ADR-0002',
  },
  {
    dir: "decision-reference-ambiguous-across-logs",
    rule: "R7",
    expect:
      'domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md:2 status: bare "ADR-0002" in a domain\'s own log means the book-level decisions/, not domains/ticketing/decisions/ — write "ticketing/ADR-0002" if you meant this domain\'s log',
  },
  {
    dir: "decision-number-not-four-digits",
    rule: "C1",
    expect:
      'domains/ticketing/decisions/001-expire-holds-after-ten-minutes.md: decision numbers are four digits — rename to "0001-expire-holds-after-ten-minutes.md"',
  },
  {
    dir: "decision-number-missing",
    rule: "C1",
    expect:
      'domains/ticketing/decisions/notes.md: decision filenames start with a four-digit number — rename to "0002-reject-a-capture-that-lands-after-the-hold-expired.md"',
  },
  {
    dir: "decision-filename-has-capitals",
    rule: "C1",
    expect:
      'domains/ticketing/decisions/0001-Expire-Holds.md: the title in a decision filename is words joined by single hyphens, each starting with a letter or digit in any script and carrying no capitals — rename to "0001-expire-holds.md"',
  },
  {
    dir: "decision-filename-gives-no-title",
    rule: "C1",
    expect:
      'domains/ticketing/decisions/0001-〇〇.md: decision filenames are a four-digit number and a title in letters and digits — "〇〇" has none, so rename to "0001-your-title-here.md"',
  },
  {
    dir: "debt-number-missing",
    rule: "C1",
    expect:
      'debt/notes.md: debt record filenames start with a four-digit number — rename to "0001-holds-are-swept-by-hand.md"',
  },
  {
    dir: "decision-number-repeated",
    rule: "C2",
    expect:
      "domains/ticketing/decisions/0001-reject-a-capture-that-lands-after-the-hold-expired.md: ADR-0001 is already domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md — decision numbers are never reused; renumber this one to 0002",
  },
  {
    dir: "debt-number-repeated",
    rule: "C2",
    expect:
      "debt/0001-holds-are-swept-by-hand.md: TDR-0001 is already debt/0001-door-scanners-trust-their-own-clock.md — debt record numbers are never reused; renumber this one to 0002",
  },
  {
    dir: "decision-number-gap",
    rule: "C3",
    expect:
      "domains/ticketing/decisions/0003-refund-a-late-capture-in-full.md: ADR-0002 is missing from domains/ticketing/decisions/ — decision numbers run from 0001 with no gaps, and a decision is never deleted",
  },
  {
    dir: "decision-number-below-0001",
    rule: "C3",
    expect:
      "decisions/0000-store-every-timestamp-in-utc.md: ADR-0000 is below 0001 — decision numbers run from 0001, so renumber this one to 0001",
  },
  {
    dir: "debt-number-gap",
    rule: "C3",
    expect:
      "debt/0003-door-scanners-trust-their-own-clock.md: TDR-0002 is missing from debt/ — debt record numbers run from 0001 with no gaps, and a debt record is never deleted",
  },
  {
    dir: "domain-debt-number-gap",
    rule: "C3",
    expect:
      "domains/ticketing/debt/0003-late-capture-refunds-are-reconciled-by-hand-each-morning.md: TDR-0002 is missing from domains/ticketing/debt/ — debt record numbers run from 0001 with no gaps, and a debt record is never deleted",
  },
  {
    dir: "decision-filename-does-not-match-title",
    rule: "C4",
    expect:
      'domains/ticketing/decisions/0001-expire-holds.md: the filename does not match the title "Expire holds after ten minutes" — rename to "0001-expire-holds-after-ten-minutes.md"',
  },
  {
    dir: "decision-title-gives-no-filename",
    rule: "C4",
    expect:
      'decisions/0001-store-the-seat-map-per-event.md: the title "〇〇" gives no filename — a decision filename is its number and its title in letters and digits, so rename to "0001-your-title-here.md"',
  },
  {
    dir: "debt-filename-does-not-match-title",
    rule: "C4",
    expect:
      'debt/0001-holds-are-swept.md: the filename does not match the title "Holds are swept by hand" — rename to "0001-holds-are-swept-by-hand.md"',
  },
  {
    dir: "domain-debt-filename-does-not-match-title",
    rule: "C4",
    expect:
      'domains/ticketing/debt/0001-hold-expiry-is-checked.md: the filename does not match the title "Hold expiry is checked only when a hold is read" — rename to "0001-hold-expiry-is-checked-only-when-a-hold-is-read.md"',
  },
  {
    dir: "domain-folder-name-mismatch",
    rule: "C5",
    expect:
      'domains/ticketing/index.md:2 id: "box-office" does not match the folder "ticketing" — rename the folder to "box-office" or set id to "ticketing"',
  },
  {
    dir: "domain-folder-name-not-a-slug",
    rule: "C5",
    expect:
      'domains/box_office/index.md:2 id: "box-office" does not match the folder "box_office" — rename the folder to "box-office"',
  },
  {
    dir: "feature-filename-mismatch",
    rule: "C6",
    expect:
      'domains/ticketing/features/hold-seats-during-checkout.md:2 id: "hold-seats" does not match the filename "hold-seats-during-checkout" — rename the file to "hold-seats.md" or set id to "hold-seats-during-checkout"',
  },
  {
    dir: "milestone-id-repeated",
    rule: "C7",
    expect:
      'roadmap.md:6 milestones[2].id: "season-passes" is already milestones[1].id — milestone ids are unique',
  },
  {
    dir: "glossary-term-not-nfc",
    rule: "C8",
    expect:
      'domains/bilheteria/glossary.md:5: "Pré-venda" is not in Unicode NFC — at character 3 it holds U+0065 U+0301 where NFC holds U+00E9; write the NFC form, or this and the same text written elsewhere will not match',
  },
  {
    dir: "feature-term-in-halfwidth-katakana",
    rule: "C9",
    expect:
      'domains/販売/features/メンバー先行で座席を確保する.md:6 terms[0]: "ﾒﾝﾊﾞｰ先行" folds to "メンバー先行" under NFKC — character 1 is U+FF92, a compatibility form; write the folded form, or this and the slug it looks like are two different names',
  },
  {
    dir: "decision-title-too-long-for-a-filename",
    rule: "C10",
    expect:
      'decisions/0001-座席表をイベントごとに保存する.md: "販売開始時に公開されていた座席表をイベントごとに保存し-販売中は座席サービスから読み直さず-公演が終わるまで保存した写しを保持することで-販売途中の差し替えが支払い済みの座席を動かすことを防ぐ" is 282 bytes as UTF-8 — a slug holds at most 247, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it',
  },
  {
    dir: "code-glob-absolute-path",
    rule: "C11",
    expect:
      'domains/ticketing/index.md:10 code[0]: "/src/ticketing/**" starts at the filesystem root — a code path is relative to the repo root, so write "src/ticketing/**"',
  },
  {
    dir: "code-glob-backslash-separator",
    rule: "C11",
    expect:
      'domains/ticketing/index.md:10 code[0]: "src\\ticketing\\**" separates folders with "\\" — a code path uses "/", so write "src/ticketing/**"',
  },
  {
    dir: "code-glob-climbs-out-of-the-repo",
    rule: "C11",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:7 code[0]: "../shared/**" climbs above the repo with ".." — a code path is relative to the repo root, so name the folder from the root instead',
  },
  {
    dir: "code-glob-empty-segment",
    rule: "C11",
    expect:
      'domains/ticketing/index.md:10 code[0]: "src//ticketing/**" has an empty path segment — remove the extra "/", so write "src/ticketing/**"',
  },
  {
    dir: "code-glob-brace-unclosed",
    rule: "C11",
    expect:
      'debt/0001-holds-are-swept-by-hand.md:7 code[0]: "src/{app,web/**" leaves "{" unclosed — close the alternatives with "}", as in "src/{app,web}/**"',
  },
];
