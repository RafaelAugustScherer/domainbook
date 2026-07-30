import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/index.js";

let home = "";
let previous = "";

const log = "domainbook/domains/ticketing/decisions";
const first = `${log}/0001-expire-holds-after-ten-minutes.md`;

beforeEach(() => {
  previous = process.cwd();
  home = mkdtempSync(join(tmpdir(), "domainbook-"));
  process.chdir(home);
});

afterEach(() => {
  process.chdir(previous);
  rmSync(home, { recursive: true, force: true });
});

function ran(...argv: string[]): string[] {
  const result = run(argv);
  expect(result.code, result.lines.join("\n")).toBe(0);
  return result.lines;
}

function failed(...argv: string[]): string[] {
  const result = run(argv);
  expect(result.code, result.lines.join("\n")).toBe(1);
  return result.lines;
}

function book(): void {
  ran("init");
  ran("new", "domain", "ticketing");
  ran("new", "feature", "hold-seats-during-checkout", "--domain", "ticketing");
  ran(
    "new",
    "decision",
    "Expire holds after ten minutes",
    "--domain",
    "ticketing"
  );
}

describe("what the generators write", () => {
  it("passes validate as written, straight through the whole flow", () => {
    book();
    ran("new", "decision", "Store every timestamp in UTC");
    ran(
      "new",
      "decision",
      "Extend holds to fifteen minutes",
      "--domain",
      "ticketing",
      "--supersedes",
      "1"
    );
    expect(ran("validate")).toEqual([
      "domainbook is a valid book — 1 domain, 1 feature, 3 decisions, 0 terms",
    ]);
  });

  it("supersedes a decision by changing its status line and nothing else", () => {
    book();
    const before = readFileSync(first, "utf8");
    expect(
      ran(
        "new",
        "decision",
        "Extend holds to fifteen minutes",
        "--domain",
        "ticketing",
        "--supersedes",
        "1"
      )
    ).toEqual([
      `wrote ${log}/0002-extend-holds-to-fifteen-minutes.md`,
      `${first} is now "superseded by ticketing/ADR-0002"`,
      'next: fill in the sections, then "domainbook validate"',
    ]);
    const after = readFileSync(first, "utf8");
    expect(after).toBe(
      before.replace(
        "status: proposed",
        "status: superseded by ticketing/ADR-0002"
      )
    );
    expect(after.split("\n")[2]).toBe(before.split("\n")[2]);
    expect(after.split("\n")[2]).toMatch(/^date: \d{4}-\d{2}-\d{2}$/);
  });

  it("qualifies the supersede reference only inside a domain's own log", () => {
    ran("init");
    ran("new", "decision", "Store every timestamp in UTC");
    ran("new", "decision", "Keep the clock on the server", "--supersedes", "1");
    expect(
      readFileSync(
        "domainbook/decisions/0001-store-every-timestamp-in-utc.md",
        "utf8"
      )
    ).toContain("status: superseded by ADR-0002\n");
  });

  it("takes the next free number in the log it is writing to", () => {
    book();
    ran("new", "decision", "Reject a late capture", "--domain", "ticketing");
    expect(ran("new", "decision", "Store every timestamp in UTC")[0]).toBe(
      "wrote domainbook/decisions/0001-store-every-timestamp-in-utc.md"
    );
    expect(
      ran(
        "new",
        "decision",
        "Refund a late capture",
        "--domain",
        "ticketing"
      )[0]
    ).toBe(`wrote ${log}/0003-refund-a-late-capture.md`);
  });

  it("writes a book that is only the files the format knows", () => {
    ran("init");
    expect(ran("validate")).toEqual([
      "domainbook is a valid book — 0 domains, 0 features, 0 decisions, 0 terms",
    ]);
  });

  it("targets a book root that is not domainbook/", () => {
    ran("init", "docs/book");
    ran("new", "domain", "ticketing", "docs/book");
    expect(ran("validate", "docs/book")).toEqual([
      "docs/book is a valid book — 1 domain, 0 features, 0 decisions, 0 terms",
    ]);
  });

  it("passes validate as written when every id reads as a number or a boolean", () => {
    mkdirSync("2026");
    process.chdir("2026");
    ran("init");
    ran("new", "domain", "9");
    ran("new", "domain", "true");
    ran("new", "feature", "2026", "--domain", "9");
    ran("new", "decision", "Expire holds after ten minutes", "--domain", "9");
    expect(ran("validate")).toEqual([
      "domainbook is a valid book — 2 domains, 1 feature, 1 decision, 0 terms",
    ]);
  });

  it("passes validate as written when the whole book is Japanese", () => {
    ran("init");
    ran("new", "domain", "販売");
    ran("new", "feature", "座席予約", "--domain", "販売");
    expect(
      ran("new", "decision", "座席の保留は十分で切れる", "--domain", "販売")[0]
    ).toBe(
      "wrote domainbook/domains/販売/decisions/0001-座席の保留は十分で切れる.md"
    );
    expect(ran("validate")).toEqual([
      "domainbook is a valid book — 1 domain, 1 feature, 1 decision, 0 terms",
    ]);
  });

  it("quotes only the ids and names that YAML would read as something else", () => {
    ran("init");
    ran("new", "domain", "9");
    ran("new", "domain", "access-control");
    ran("new", "feature", "true", "--domain", "9");
    expect(readFileSync("domainbook/roadmap.md", "utf8")).toContain(
      "\nid: domainbook-"
    );
    expect(readFileSync("domainbook/domains/9/index.md", "utf8")).toContain(
      '---\nid: "9"\nname: "9"\n'
    );
    expect(
      readFileSync("domainbook/domains/9/features/true.md", "utf8")
    ).toContain('---\nid: "true"\nname: "True"\n');
    expect(
      readFileSync("domainbook/domains/access-control/index.md", "utf8")
    ).toContain("---\nid: access-control\nname: Access control\n");
  });

  it("points the next command at the root it wrote, whatever that root is", () => {
    expect(ran("init", ".")[1]).toBe(
      'next: name the milestone in roadmap.md, then "domainbook new domain <id> ." for your first bounded context'
    );
    mkdirSync("my book");
    expect(ran("init", "my book")[1]).toBe(
      "next: name the milestone in roadmap.md, then \"domainbook new domain <id> 'my book'\" for your first bounded context"
    );
  });
});

describe("validate", () => {
  it("prints every issue sorted by file, one per line, and exits 1", () => {
    book();
    const page = "domainbook/domains/ticketing/index.md";
    const feature =
      "domainbook/domains/ticketing/features/hold-seats-during-checkout.md";
    writeFileSync(
      page,
      readFileSync(page, "utf8").replace("id: ticketing", "id: tickets")
    );
    writeFileSync(
      feature,
      readFileSync(feature, "utf8").replace("status: draft", "status: shipped")
    );
    expect(failed("validate")).toEqual([
      `${feature}:4 status: must be one of "draft", "ready", "implemented", "deprecated"`,
      `${page}:2 id: "tickets" does not match the folder "ticketing" — rename the folder to "tickets" or set id to "ticketing"`,
    ]);
  });

  it("says there is no book when the root does not exist", () => {
    expect(failed("validate")).toEqual([
      'domainbook: no book here — run "domainbook init domainbook" to write one',
    ]);
  });
});

describe("what the CLI says when it is misused", () => {
  it("names an unknown command and lists the real ones", () => {
    expect(failed("chekc")).toEqual([
      '"chekc" is not a domainbook command — the commands are validate, init, and new; run "domainbook --help" to see them',
    ]);
  });

  it("asks for a command when it is given none", () => {
    expect(failed()).toEqual([
      'domainbook needs a command — validate, init, or new; run "domainbook --help" to see them',
    ]);
  });

  it("names the option a feature needs and writes out the fix", () => {
    ran("init");
    expect(failed("new", "feature", "hold-seats")).toEqual([
      '"domainbook new feature" needs the domain the feature belongs to — write "domainbook new feature hold-seats --domain <domain-id>"',
    ]);
  });

  it("lists the domains that exist when the one named does not", () => {
    book();
    expect(
      failed("new", "feature", "hold-seats", "--domain", "billing")
    ).toEqual([
      'no domain "billing" in domainbook — run "domainbook new domain billing" first, or name one of ticketing',
    ]);
  });

  it("lists the decisions that exist when --supersedes names none", () => {
    book();
    expect(
      failed(
        "new",
        "decision",
        "Extend holds",
        "--domain",
        "ticketing",
        "--supersedes",
        "7"
      )
    ).toEqual([`no ADR-0007 in ${log}/ — it holds ADR-0001`]);
  });

  it("says a log is empty rather than listing nothing", () => {
    ran("init");
    expect(
      failed("new", "decision", "Extend holds", "--supersedes", "1")
    ).toEqual([
      "no ADR-0001 in domainbook/decisions/ — that log holds no decisions yet, so there is nothing to supersede",
    ]);
  });

  it("refuses --supersedes that is not a number", () => {
    book();
    expect(
      failed("new", "decision", "Extend holds", "--supersedes", "ADR-0001")
    ).toEqual([
      '"--supersedes ADR-0001" is not a decision number — pass the number of the decision this one replaces, as in "--supersedes 3"',
    ]);
  });

  it("refuses to supersede a decision whose frontmatter does not parse", () => {
    book();
    writeFileSync(first, "---\nstatus: [broken\n---\n\n# Old\n");
    expect(
      failed(
        "new",
        "decision",
        "Extend holds",
        "--domain",
        "ticketing",
        "--supersedes",
        "1"
      )
    ).toEqual([
      `${first} has frontmatter that does not parse as YAML — run "domainbook validate" to see what is wrong, fix it, then write the new decision again`,
    ]);
  });

  it("refuses to write a book into a root that already holds one", () => {
    ran("init");
    expect(failed("init")).toEqual([
      '"domainbook" is not empty — it holds "domainbook.config.yaml"; "domainbook init" writes a new book into an empty folder, so pass another root, or edit the book that is already here',
    ]);
  });

  it("refuses a book root that is a file", () => {
    writeFileSync("notes.md", "");
    expect(failed("init", "notes.md")).toEqual([
      '"notes.md" is a file — a book root is a folder; pass one that is empty, or one that does not exist yet',
    ]);
  });

  it("suggests the slug for an id that is not one", () => {
    ran("init");
    expect(failed("new", "domain", "Access Control")).toEqual([
      '"Access Control" is not a domain id — write words joined by single hyphens, where a word starts with a letter or digit in any script and carries no capitals, as in "access-control"',
    ]);
  });

  it("suggests a slug that is itself writable, not a fullwidth one", () => {
    ran("init");
    expect(failed("new", "domain", "ＳＥＡＴ")).toEqual([
      '"ＳＥＡＴ" is not a domain id — write words joined by single hyphens, where a word starts with a letter or digit in any script and carries no capitals, as in "seat"',
    ]);
  });

  it("refuses to write over a page that is already there", () => {
    book();
    expect(failed("new", "domain", "ticketing")).toEqual([
      "domainbook/domains/ticketing/index.md already exists — edit what is there, or pick another id",
    ]);
  });

  it("names a mistyped option and lists the ones the command takes", () => {
    expect(
      failed("new", "feature", "hold-seats", "--domian", "ticketing")
    ).toEqual([
      '"--domian" is not a domainbook option — "domainbook new feature" takes --domain and --help; usage: domainbook new feature <id> [root] --domain <domain-id>',
    ]);
    expect(
      failed("new", "decision", "Extend holds", "--superseeds", "1")
    ).toEqual([
      '"--superseeds" is not a domainbook option — "domainbook new decision" takes --domain, --supersedes, and --help; usage: domainbook new decision "<title>" [root] [--domain <domain-id>] [--supersedes <number>]',
    ]);
  });

  it("never offers an option to a command that would reject it", () => {
    expect(failed("validate", "--bogus")).toEqual([
      '"--bogus" is not a domainbook option — "domainbook validate" takes only --help; usage: domainbook validate [root]',
    ]);
    expect(failed("init", "--bogus")).toEqual([
      '"--bogus" is not a domainbook option — "domainbook init" takes only --help; usage: domainbook init [root]',
    ]);
    expect(failed("--bogus")).toEqual([
      '"--bogus" is not a domainbook option — the options are --domain, --supersedes, --help, and --version; run "domainbook --help" to see which command takes which',
    ]);
  });

  it("names a mistyped option whatever its case", () => {
    expect(
      failed("new", "feature", "hold-seats", "--Domain", "ticketing")
    ).toEqual([
      '"--Domain" is not a domainbook option — "domainbook new feature" takes --domain and --help; usage: domainbook new feature <id> [root] --domain <domain-id>',
    ]);
  });

  it("names the flag a user typed when they hang a value off it", () => {
    expect(failed("--version=1")).toEqual([
      '"--version" takes no value — write "--version" on its own',
    ]);
    expect(failed("--help=1")).toEqual([
      '"--help" takes no value — write "--help" on its own',
    ]);
  });

  it("says an option was given no value", () => {
    expect(failed("new", "feature", "hold-seats", "--domain")).toEqual([
      '"--domain" was given no value — write "--domain <value>"',
    ]);
  });

  it("shows how to pass a value that starts with a dash", () => {
    expect(
      failed("new", "decision", "Extend holds", "--supersedes", "-1")
    ).toEqual([
      '"--supersedes -1" reads as two options — write "--supersedes=-1" to pass a value that starts with a dash',
    ]);
  });

  it("rejects an option the command does not take, with its usage", () => {
    expect(failed("validate", "--domain", "ticketing")).toEqual([
      '"--domain" is not an option here — usage: domainbook validate [root]',
    ]);
  });

  it("rejects a positional the command does not take, with its usage", () => {
    expect(failed("validate", "one", "two")).toEqual([
      '"two" does not belong here — usage: domainbook validate [root]',
    ]);
  });

  it("asks for the id or title a generator is missing", () => {
    expect(failed("new")).toEqual([
      '"domainbook new" needs what to write — a domain, a feature, or a decision',
    ]);
    expect(failed("new", "thing", "x")).toEqual([
      '"thing" is not a domainbook artifact — "domainbook new" writes a domain, a feature, or a decision',
    ]);
    expect(failed("new", "decision")).toEqual([
      '"domainbook new decision" needs a title — usage: domainbook new decision "<title>" [root] [--domain <domain-id>] [--supersedes <number>]',
    ]);
  });

  it("refuses a decision title that gives no filename", () => {
    ran("init");
    expect(failed("new", "decision", "???")).toEqual([
      '"???" gives no filename — a decision filename is a four-digit number and the title in letters and digits, and this title has none; write one that has some',
    ]);
  });

  it("refuses to write into a root that holds no book", () => {
    ran("init", "docs/book");
    const missing =
      'no book in docs/bok — every book has a roadmap.md; run "domainbook init docs/bok" to write one, or pass the root of the book you meant';
    expect(failed("new", "domain", "billing", "docs/bok")).toEqual([missing]);
    expect(failed("new", "decision", "Expire holds", "docs/bok")).toEqual([
      missing,
    ]);
    expect(
      failed("new", "feature", "checkout", "docs/bok", "--domain", "billing")
    ).toEqual([missing]);
    expect(ran("validate", "docs/book")).toEqual([
      "docs/book is a valid book — 0 domains, 0 features, 0 decisions, 0 terms",
    ]);
  });

  it("names the file standing where a folder has to go", () => {
    ran("init");
    mkdirSync("domainbook/domains");
    writeFileSync("domainbook/domains/billing", "");
    expect(failed("new", "domain", "billing")).toEqual([
      '"domainbook/domains/billing" is a file, and a folder has to go there — move it or delete it, then run this again',
    ]);
  });

  it("names the file standing where a features folder has to go", () => {
    ran("init");
    ran("new", "domain", "ticketing");
    writeFileSync("domainbook/domains/ticketing/features", "");
    expect(
      failed("new", "feature", "refund-order", "--domain", "ticketing")
    ).toEqual([
      '"domainbook/domains/ticketing/features" is a file, and a folder has to go there — move it or delete it, then run this again',
    ]);
  });

  it("refuses a title whose slug is over the byte cap, before writing", () => {
    ran("init");
    const words = Array.from({ length: 75 }, () => "word");
    expect(failed("new", "decision", words.join(" "))).toEqual([
      `"${words.join(" ")}" gives the filename slug "${words.join(
        "-"
      )}", which is 374 bytes as UTF-8 — a slug holds at most 247 bytes, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; write a shorter title`,
    ]);
    expect(existsSync("domainbook/decisions")).toBe(false);
  });

  it("counts the byte cap in UTF-8, not in characters", () => {
    ran("init");
    const short = "座".repeat(82);
    const over = "座".repeat(83);
    expect(ran("new", "decision", short)[0]).toBe(
      `wrote domainbook/decisions/0001-${short}.md`
    );
    expect(failed("new", "decision", over)).toEqual([
      `"${over}" gives the filename slug "${over}", which is 249 bytes as UTF-8 — a slug holds at most 247 bytes, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; write a shorter title`,
    ]);
  });

  it("refuses an id over the byte cap, whatever the script", () => {
    ran("init");
    const long = "a".repeat(248);
    expect(failed("new", "domain", long)).toEqual([
      `the domain id "${long}" is 248 bytes as UTF-8 — a domain id holds at most 247 bytes, so the filenames it forms fit the 255 bytes ext4 and APFS give one; write a shorter one`,
    ]);
  });

  it("refuses a fullwidth id that masquerades as its ASCII twin", () => {
    ran("init");
    expect(failed("new", "domain", "ｓｅａｔ-ｍａｐ")).toEqual([
      'the domain id "ｓｅａｔ-ｍａｐ" folds to "seat-map" under NFKC — character 1 is U+FF53, a compatibility form; write "seat-map" instead, or this and the domain id it looks like are two different names',
    ]);
    expect(existsSync("domainbook/domains")).toBe(false);
  });

  it("refuses a fullwidth decision title, the way an IME hands one over", () => {
    ran("init");
    expect(failed("new", "decision", "ＳＥＡＴ Ｍａｐ")).toEqual([
      'the decision title "ＳＥＡＴ Ｍａｐ" folds to "SEAT Map" under NFKC — character 1 is U+FF33, a compatibility form; write "SEAT Map" instead, or this and the decision title it looks like are two different names',
    ]);
    expect(existsSync("domainbook/decisions")).toBe(false);
  });

  it("refuses a decomposed id, naming the code points and the composed form", () => {
    book();
    const decomposed = "cafe\u0301-menu";
    expect(
      failed("new", "feature", decomposed, "--domain", "ticketing")
    ).toEqual([
      `the feature id "${decomposed}" is not in Unicode NFC — at character 4 it holds U+0065 U+0301 where NFC holds U+00E9; write "café-menu" instead, or this and the same text written elsewhere will not match`,
    ]);
  });

  it("refuses a decomposed decision title the same way", () => {
    ran("init");
    const decomposed = "Cafe\u0301 policy";
    expect(failed("new", "decision", decomposed)).toEqual([
      `the decision title "${decomposed}" is not in Unicode NFC — at character 4 it holds U+0065 U+0301 where NFC holds U+00E9; write "Café policy" instead, or this and the same text written elsewhere will not match`,
    ]);
  });

  it("refuses a fullwidth --domain before it looks for the domain", () => {
    book();
    expect(
      failed("new", "feature", "hold-seats", "--domain", "ｔｉｃｋｅｔｉｎｇ")
    ).toEqual([
      'the domain id "ｔｉｃｋｅｔｉｎｇ" folds to "ticketing" under NFKC — character 1 is U+FF54, a compatibility form; write "ticketing" instead, or this and the domain id it looks like are two different names',
    ]);
  });
});

describe("--help", () => {
  it("prints every command and option, and exits 0", () => {
    const lines = ran("--help");
    expect(lines[0]).toBe(
      "domainbook — living documentation for a codebase, enforced from the repo"
    );
    expect(lines).toContain("  domainbook validate [root]");
    expect(lines).toContain("  domainbook init [root]");
    expect(lines).toContain("  domainbook new domain <id> [root]");
    expect(lines).toContain(
      "  domainbook new feature <id> [root] --domain <domain-id>"
    );
    expect(lines).toContain(
      '  domainbook new decision "<title>" [root] [--domain <domain-id>] [--supersedes <number>]'
    );
    expect(lines).toContain("  -h, --help              print this");
    expect(lines).toContain(
      "  -v, --version           print the version of domainbook that is installed"
    );
    expect(lines.at(-1)).toBe('root defaults to "domainbook".');
  });
});

describe("--version", () => {
  it("prints the version of the package it is running from, and exits 0", () => {
    expect(ran("--version")).toEqual([`domainbook ${shipped()}`]);
    expect(ran("-v")).toEqual([`domainbook ${shipped()}`]);
  });

  it("refuses a command that asks for one, and names the form that works", () => {
    const message =
      '"--version" is not an option here — domainbook has one version, not one per command; write "domainbook --version" on its own';
    expect(failed("validate", "--version")).toEqual([message]);
    expect(failed("init", "--version")).toEqual([message]);
    expect(failed("new", "domain", "ticketing", "--version")).toEqual([
      message,
    ]);
    expect(failed("new", "feature", "hold-seats", "-v")).toEqual([message]);
    expect(failed("new", "decision", "Extend holds", "--version")).toEqual([
      message,
    ]);
  });
});

function shipped(): string {
  const manifest = readFileSync(
    new URL("../package.json", import.meta.url),
    "utf8"
  );
  return (JSON.parse(manifest) as { version: string }).version;
}
