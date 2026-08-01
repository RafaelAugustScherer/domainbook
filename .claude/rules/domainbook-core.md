---
paths:
  - "packages/core/src/body/**"
  - "packages/core/src/change.ts"
  - "packages/core/src/check.ts"
  - "packages/core/src/check/**"
  - "packages/core/src/index.ts"
  - "packages/core/src/issue.ts"
  - "packages/core/src/load.ts"
  - "packages/core/src/load/**"
  - "packages/core/src/log.ts"
  - "packages/core/src/map.ts"
  - "packages/core/src/model.ts"
  - "packages/core/src/read.ts"
  - "packages/core/src/ref.ts"
  - "packages/core/src/unicode.ts"
  - "packages/core/src/validate.ts"
  - "packages/core/test/*.ts"
  - "packages/cli/**"
---

# Core

Code here is claimed by the core domain. Changing it means updating `domainbook/domains/core/` in the same commit, or waiving the commit with a "Skip-Docs: <reason>" trailer. Any file under that folder clears the check: the canvas, the glossary, the changelog, a feature, a decision, or a debt record.

Before you name anything here, call `explain_terms` with the words you are about to use — this context has its own, and they win over the book's. `domainbook/domains/core/index.md` holds its canvas.
