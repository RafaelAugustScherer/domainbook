---
"@domainbook/core": minor
"domainbook": minor
---

Write known debt down where the code is.

A book gains a seventh artifact type: `debt/NNNN-<slug>.md` at the root and
inside each domain, the decision log's twin. Four required fields —
`status: open | accepted | repaid`, `date`, `severity: low | medium | high |
critical`, and `quadrant`, Fowler's four boxes — plus optional `owners`, `code:`
globs tracing the debt to what carries it, and `decisions:` naming the ADR whose
consequences incurred it. The body is Debt, what it costs in Impact, and what
repayment looks like in Remedy. Unlike a decision, a debt record is living: it
is edited in place and its status flipped, never superseded.
`debt.schema.json` is generated and committed with the other schemas.

`domainbook new debt "<title>" [root] [--domain <domain-id>]` writes one that
already validates, taking the next free number in the log it lands in. There is
no `--supersedes` here, and passing one is refused.

`code:` globs are now checked for syntax wherever they appear — on a domain page
as well as on a debt record. An absolute path, a `..` climbing out of the repo, a
backslash separator, an empty segment, an unbalanced `{}` or `[]`, and a pattern
naming no path each come back with the pattern to write instead. A domain page's
globs were never checked before, so a book carrying `/src/billing/**` passed
validation and quietly matched nothing; it now reports one issue per pattern.

Inside `@domainbook/core` the two logs share one machine rather than a copy:
`DecisionFile` is now `LogFile`, `DecisionRecord` and the new `DebtRecord` are
both `LogRecord<T>`, and `debtSchema` and `Debt` join the exports. `validate`'s
success line ends with a count of debt records, and the messages that list what
a book root or a domain folder holds now name `debt/`.
