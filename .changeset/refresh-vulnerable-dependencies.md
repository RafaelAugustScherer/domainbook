---
"@domainbook/site": patch
---

Update astro to 7.2.10 to clear a critical advisory (RCE via AVIF image
optimization, GHSA-26w7-cxv4-gfx2) and a base-path authorization bypass
(GHSA-376h-93r7-7g6f), and refresh its transitive sharp, svgo, and js-yaml to
their patched releases. The test runner (vitest) is bumped to 4.1.11 across the
workspace for the same reason; that change does not affect any published output.
