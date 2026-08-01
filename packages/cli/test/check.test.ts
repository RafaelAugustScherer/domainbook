import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  claims,
  committed,
  enter,
  failed,
  git,
  leave,
  ran,
  wrote,
} from "./repo.js";

const message = ".git/COMMIT_EDITMSG";

const stale =
  'ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain\'s book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer';

beforeEach(() => {
  vi.stubEnv("CLAUDECODE", undefined);
  vi.stubEnv("SKIP_DOCS", undefined);
  enter();
  ran("init");
  claims("ticketing", "src/ticketing/**");
  committed("Start the book");
});

afterEach(() => {
  leave();
  vi.unstubAllEnvs();
});

let edits = 0;

function staging(...paths: string[]): void {
  edits += 1;
  for (const path of paths) wrote(path, `export const one = ${edits}\n`);
  git("add", "-A");
}

function wroteMessage(...lines: string[]): void {
  wrote(message, `${lines.join("\n")}\n`);
}

describe("what the check says about a staged change", () => {
  it("blocks the commit and names the domain and the file", () => {
    staging("src/ticketing/hold.ts");
    wroteMessage("Move the hold sweeper");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
    ]);
  });

  it("lets the same change through once the domain's book is staged", () => {
    staging("src/ticketing/hold.ts");
    ran(
      "new",
      "decision",
      "Expire holds after ten minutes",
      "--domain",
      "ticketing"
    );
    git("add", "-A");
    expect(ran("check", "--staged")).toEqual([
      "domainbook: 1 domain checked, nothing stale",
    ]);
  });

  it("says nothing about a path no domain claims", () => {
    staging("README.md", "scripts/release.sh");
    expect(ran("check", "--staged")).toEqual([
      "domainbook: nothing staged that a domain claims",
    ]);
  });

  it("names a book edit that was written and never staged", () => {
    staging("src/ticketing/hold.ts");
    wrote("domainbook/domains/ticketing/changelog.md", "# Changelog\n");
    wroteMessage("Move the hold sweeper");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
      'domainbook/domains/ticketing/changelog.md is edited but not staged — "git add domainbook/domains/ticketing/changelog.md" clears this',
    ]);
  });

  it("names three stale files and counts the rest", () => {
    staging(
      "src/ticketing/hold.ts",
      "src/ticketing/expiry.ts",
      "src/ticketing/seat.ts",
      "src/ticketing/row.ts"
    );
    wroteMessage("Move the hold sweeper");
    expect(failed("check", "--staged", "--message-file", message)[0]).toContain(
      "ticketing: src/ticketing/expiry.ts, src/ticketing/hold.ts, src/ticketing/row.ts and 1 more changed"
    );
  });

  it("says the waiver could not be read when no message file was passed", () => {
    staging("src/ticketing/hold.ts");
    expect(failed("check", "--staged")).toEqual([
      stale,
      'this run read no commit message, so a waiver on it could not be seen — the commit-msg hook passes one, and "domainbook check --staged --message-file <file>" does too',
    ]);
  });

  it("reports the same finding and lets the commit through in warn mode", () => {
    wrote("domainbook/domainbook.config.yaml", "enforcement:\n  mode: warn\n");
    staging("src/ticketing/hold.ts");
    wroteMessage("Move the hold sweeper");
    expect(ran("check", "--staged", "--message-file", message)).toEqual([
      stale,
    ]);
  });

  it("refuses to judge a change against a book that does not validate", () => {
    const page = "domainbook/domains/ticketing/index.md";
    wrote(
      page,
      readFileSync(page, "utf8").replace("id: ticketing", "id: tickets")
    );
    staging("src/ticketing/hold.ts");
    expect(failed("check", "--staged")).toEqual([
      'domainbook: this book does not validate, so the code it claims cannot be trusted — run "domainbook validate" and fix what it names, then commit again',
    ]);
  });

  it("names a book root that is not there rather than calling it invalid", () => {
    staging("src/ticketing/hold.ts");
    expect(failed("check", "--staged", "docs/book")).toEqual([
      'docs/book: no book here — run "domainbook init docs/book" to write one',
    ]);
  });
});

describe("what the check does with a waiver", () => {
  it("lets a trailer with a reason clear the commit", () => {
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it", "", "Skip-Docs: renamed a private helper");
    expect(ran("check", "--staged", "--message-file", message)).toEqual([
      "domainbook: waived — Skip-Docs: renamed a private helper",
    ]);
  });

  it("does not read the same words in the middle of the message", () => {
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it", "", "Skip-Docs: not worth it", "and then prose.");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
    ]);
  });

  it("refuses an agent's empty trailer and says what to write", () => {
    vi.stubEnv("CLAUDECODE", "1");
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it", "", "Skip-Docs:");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
      'the "Skip-Docs" trailer on this commit carries no reason — write what makes this change safe to leave undocumented, as in "Skip-Docs: renamed a private helper, no behaviour changed"',
    ]);
  });

  it("tells an agent reaching for the human escape which one is its own", () => {
    vi.stubEnv("CLAUDECODE", "1");
    vi.stubEnv("SKIP_DOCS", "1");
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
      'SKIP_DOCS=1 waives without a reason, and this shell is an agent\'s — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead',
    ]);
  });

  it("stamps a person's wordless waiver into the message", () => {
    vi.stubEnv("SKIP_DOCS", "1");
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it");
    expect(ran("check", "--staged", "--message-file", message)).toEqual([
      "domainbook: waived — Skip-Docs: human bypass",
    ]);
    expect(readFileSync(message, "utf8")).toBe(
      "Move it\n\nSkip-Docs: human bypass\n"
    );
  });

  it("keeps a reason a person wrote rather than stamping a second trailer", () => {
    vi.stubEnv("SKIP_DOCS", "1");
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it", "", "Skip-Docs: vendored file, upstream owns it");
    ran("check", "--staged", "--message-file", message);
    expect(readFileSync(message, "utf8")).toBe(
      "Move it\n\nSkip-Docs: vendored file, upstream owns it\n"
    );
  });

  it("stamps nothing when nothing needed waiving", () => {
    vi.stubEnv("SKIP_DOCS", "1");
    staging("README.md");
    wroteMessage("Docs tweak");
    ran("check", "--staged", "--message-file", message);
    expect(readFileSync(message, "utf8")).toBe("Docs tweak\n");
  });

  it("holds a person to the agent's bar when the book asks for prose", () => {
    vi.stubEnv("SKIP_DOCS", "1");
    wrote(
      "domainbook/domainbook.config.yaml",
      "enforcement:\n  require_reason: always\n"
    );
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it");
    expect(failed("check", "--staged", "--message-file", message)).toEqual([
      stale,
      'SKIP_DOCS=1 waives without a reason, and this book sets enforcement.require_reason to always — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead',
    ]);
    expect(readFileSync(message, "utf8")).toBe("Move it\n");
  });

  it("answers a repo that renamed the key in its own words", () => {
    wrote(
      "domainbook/domainbook.config.yaml",
      "enforcement:\n  trailer: Docs-Waiver\n"
    );
    staging("src/ticketing/hold.ts");
    wroteMessage("Move it", "", "Skip-Docs: renamed a private helper");
    expect(failed("check", "--staged", "--message-file", message)[0]).toContain(
      'or waive this commit with a "Docs-Waiver: <reason>" trailer'
    );
    vi.stubEnv("SKIP_DOCS", "1");
    wroteMessage("Move it");
    expect(ran("check", "--staged", "--message-file", message)).toEqual([
      "domainbook: waived — Docs-Waiver: human bypass",
    ]);
    expect(readFileSync(message, "utf8")).toBe(
      "Move it\n\nDocs-Waiver: human bypass\n"
    );
  });
});

describe("what the check says about a branch", () => {
  it("judges the range as one change, so the book may arrive later", () => {
    const base = git("rev-parse", "HEAD").trim();
    staging("src/ticketing/hold.ts");
    committed("Move the hold sweeper");
    expect(failed("check", "--range", `${base}..HEAD`)).toEqual([stale]);
    wrote("domainbook/domains/ticketing/changelog.md", "# Changelog\n");
    committed("Document the sweeper");
    expect(ran("check", "--range", `${base}..HEAD`)).toEqual([
      "domainbook: 1 domain checked, nothing stale",
    ]);
  });

  it("takes a waiver on any commit in the range as clearing the range", () => {
    const base = git("rev-parse", "HEAD").trim();
    staging("src/ticketing/hold.ts");
    committed("Move the hold sweeper");
    staging("src/ticketing/hold.ts");
    git(
      "commit",
      "-q",
      "--no-verify",
      "-m",
      "Put it back\n\nSkip-Docs: reverted, nothing left to document"
    );
    expect(ran("check", "--range", `${base}..HEAD`)).toEqual([
      "domainbook: waived — Skip-Docs: reverted, nothing left to document",
    ]);
  });

  it("refuses a checkout that cannot reach the base commit", () => {
    expect(failed("check", "--range", `${"0".repeat(40)}..HEAD`)).toEqual([
      "this checkout does not reach the base commit, so the range cannot be read — set fetch-depth to 0 on the checkout step, and run this again",
    ]);
  });

  it("asks for a range it can read when given something else", () => {
    expect(failed("check", "--range", "main")).toEqual([
      '"main" is not a commit range — write it as "<base>..<head>", naming the commit the branch started from and the one it ends at',
    ]);
  });
});

describe("what the check refuses to be asked", () => {
  it("needs to know what to read", () => {
    expect(failed("check")[0]).toContain(
      '"domainbook check" needs to know what to read'
    );
  });

  it("reads one change at a time", () => {
    expect(failed("check", "--staged", "--range", "a..b")[0]).toContain(
      '"--staged" and "--range" read different changes'
    );
  });

  it("takes a message file only alongside the staged change it belongs to", () => {
    expect(
      failed("check", "--range", "a..b", "--message-file", message)[0]
    ).toContain('"--message-file" is a commit message to read a waiver from');
  });
});
