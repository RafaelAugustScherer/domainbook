---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Accept a slug in any script

## Context and Problem Statement

A slug is every id in a book: a domain's id, a feature's id, the reference a
feature makes to a glossary term, and the title half of a decision's filename.
Until now a slug was `[a-z0-9]` words joined by single hyphens, and a name was
slugged by folding it to NFKD, dropping the combining marks, and turning
everything else into a hyphen.

That folding has a floor: a name written outside Latin leaves nothing behind. A
team whose ubiquitous language is Japanese, Arabic, Hindi or Portuguese could
define a term and then had no id to reference it by — 注文履行 slugged to the
empty string, and the tool's answer was that the name gave no filename. The
format's whole claim is that a book is written in the words the team already
uses, and the id grammar contradicted it for most of the world.

Widening the grammar is not free. The slug is published in a JSON Schema that
non-JavaScript tools read (`format/ADR-0001`), and it is also a path component
on three filesystems that disagree about what a filename is.

## Decision Drivers

- Ubiquitous language means the team's own words. An id grammar that only Latin
  scripts can satisfy makes that a promise the format keeps for some teams.
- A slug is a filename. Whatever it accepts has to survive being written to ext4,
  APFS and NTFS, and being read back on a different one.
- Two ids that look the same must be the same id, or a reference means one thing
  in an editor and another in the loader.
- No book that validates today may stop validating.

## Considered Options

- Keep `[a-z0-9]` and tell non-Latin teams to transliterate.
- Accept letters and digits in any script, expressed with Unicode property
  escapes (`\p{…}`) in the published pattern.
- Accept the same set, but expand it to explicit code-point ranges so the
  published pattern uses no escape classes.

## Decision Outcome

Chosen option: "Accept letters and digits in any script, written with property
escapes". The grammar is now:

```
/^[\p{Ll}\p{Lo}\p{Lm}\p{Nd}][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]*(?:-…)*$/u
```

Every clause is there for a reason:

- `\p{M}` is required, or डोमेन and ก่อน are rejected — their vowel signs are
  marks, not letters, so a word in Devanagari or Thai cannot be spelled without
  them. Marks may not open a segment, because a word that begins with a mark
  begins with nothing to attach it to.
- `\p{Lm}` is required for Japanese: ー and 々 are modifier letters, so コーヒー豆
  and 各々 need it.
- `\p{Nd}` rather than `\p{N}`, because `\p{N}` admits Ⅳ and ½, which fold to the
  ASCII `IV` and `1⁄2` and would give two spellings of one id.
- Excluding `\p{Lu}` and `\p{Lt}` is how "no capitals" is now said, and saying it
  in the pattern is the point: a `toLowerCase()` comparison in our own code would
  hold the rule where only our validator can read it, and the published spec has
  to carry it too.

The set is a strict superset of the old one for ASCII, so no id in an existing
book changes meaning: a randomised test compares the two grammars over thousands
of `[a-z0-9-]` strings and finds no string the old grammar accepted and this one
rejects.

Expanding to explicit code-point ranges was rejected: zod copies a regex's
`.source` into the schema, so the zod definition itself would become a ten-kilobyte
blob pinned to one version of Unicode, and every reader of `common.ts` would meet
that instead of the rule.

Three rules cannot be written as a regex at all. All three are checked by
`validate` and refused by the generators before they write:

- **NFC required, never rewritten silently.** The id is a path component, and
  APFS is normalization-*insensitive* while ext4 and NTFS are not: `café.md`
  written in NFC and in NFD is one file on macOS and two on Linux. Git's
  `core.precomposeunicode` only covers what macOS itself adds, and does nothing
  for a file arriving from elsewhere, so the validator is the only place this can
  be caught. Rewriting it for the author would change a filename behind their
  back, so the tool refuses instead, naming the code point it found and the form
  to write.
- **NFKC-stable**: a slug must equal its own NFKC form. Without it, ｓｅａｔ-ｍａｐ in
  fullwidth Latin is a legal slug, distinct from `seat-map`, that folds onto it —
  and fullwidth is a default IME mode for Japanese input, so it is a first-try
  experience rather than an exotic one. Two things make the rule safe: the
  characters NFKC folds hardest — ①, ㍿, ㈱ — are outside the slug class entirely
  and never reach a slug, so NFKC here only ever rejects look-alike letters and
  digits; and NFKC-normalized text is a subset of NFC-normalized text, so the two
  rules nest instead of contradicting each other.
- **247 UTF-8 bytes**, so that `NNNN-<slug>.md` fits the 255-byte component limit
  ext4 and APFS impose. Bytes rather than characters, because a CJK character is
  three of them.

### Consequences

- Good, because a team documents its domain in its own language: 注文履行,
  تنفيذ-الطلب, आदेश-पूर्ति and コーヒー豆 are ids, and the term a feature references is
  spelled the way the team spells it.
- Good, because an accented Latin name now keeps its accent instead of being
  approximated: "Café Order" is `café-order`, not `cafe-order`.
- Good, because the ambiguities that widening usually brings are closed by rule
  rather than left to luck — one normalization form, no compatibility look-alikes,
  and a byte budget that fits the filesystems books actually live on.
- **Bad, because the published JSON Schema is no longer portable, and this is the
  real price.** JSON Schema Core §6.4 recommends compiling `pattern` with the `u`
  flag, but the constructs it guarantees are portable include no escape classes at
  all. What consumers do with it splits in two, and the worse half is the quiet one:
  - Python fails loudly. `jsonschema` 4.26.0 rejects the schema at
    `check_schema()`, because the metaschema declares `"pattern": {"format":
    "regex"}` and format checking has been on by default since 4.17.0. At
    validation time it escapes as an uncaught `re.error` rather than a
    `ValidationError`, so a consumer catching only `ValidationError` crashes.
    `fastjsonschema` 2.22.1 dies at compile and does not implement 2020-12 at all.
  - JavaScript fails *silently*, and gives the opposite answer. Ajv works by
    default because `unicodeRegExp` is `true`; a consumer who sets it to `false`,
    or who writes `new RegExp(pattern)` by hand, compiles the pattern with no
    error at all. Under Annex B, `\p` degrades to a literal `p`, the class becomes
    the set `p { L l }`, and so 注文履行 is rejected while the literal string
    `p{Ll}` is accepted. Wrong answers, no exception. "A loud break is
    recoverable" is true of Python only.
- Bad, because this retires a promise the roadmap and the README both made in
  prose — that editors and non-JS tools consume the same spec without drift. They
  consume the same spec; whether they agree with it now depends on their regex
  engine. Both pages have been corrected rather than left standing beside this.
- Neutral, because the only warning a consumer gets is prose: every `description`
  on a pattern ends with a sentence naming the `u` flag, and a test asserts that
  sentence can never go missing. A `format: "domainbook-slug"` annotation was
  tried and withdrawn — §7.2 makes an unknown format annotation-only, so it
  enforced nothing, and Ajv's default strict mode rejected the whole schema with
  `unknown format … ignored in schema`.
- Neutral, because 〇 U+3007 is `Nl` and not `Nd`, so 二〇二五-年度 is rejected while
  二千二十五 passes. A year written with the ideographic zero needs another spelling.
- Bad, because one confusable pair stays open: İstanbul lowercases to i̇stanbul
  (`i` followed by U+0307), which is a legal slug, NFC-stable and NFKC-stable, and
  a near-twin of `istanbul`. Closing it needs a full UTS #39 confusable check, and
  that is out of scope here. It is recorded rather than solved.
- Neutral, because `format: "date"` also throws under a bare Ajv, and that one is
  not ours: zod emits it for `z.iso.date()`, Ajv ships no format implementations
  in core, and `ajv-formats` is Ajv's own one-line answer. It is a
  spec-vocabulary format every editor already knows, so it stays.

### Confirmation

`slug.test.ts` holds the grammar's own cases — accepted: Japanese, Hangul,
Arabic, Hebrew, Devanagari with its vowel signs and its digits, Thai, and a
precomposed `café`; rejected: capitals inside and outside ASCII, a leading mark,
〇, Ⅳ, ½, a zero-width space and a right-to-left override. Three more tests hold
what this decision costs: that the old ASCII grammar and this one never disagree,
that the published pattern means the opposite without the `u` flag, and that
every described pattern in `packages/core/schema` ends with the sentence naming
that flag. The `japanese-slugs` book under `valid-books/` proves a whole book of
them loads, and `glossary-term-not-nfc` and `feature-term-in-halfwidth-katakana`
prove the two rules a regex could not carry.
