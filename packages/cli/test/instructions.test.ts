import { existsSync, readFileSync, rmSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claims, enter, failed, leave, ran, wrote } from "./repo.js";

const rule = ".claude/rules/domainbook-ticketing.md";

beforeEach(() => {
  enter();
  ran("init");
  claims("ticketing", "src/ticketing/**");
});

afterEach(leave);

function held(file: string): string {
  return readFileSync(file, "utf8");
}

describe("what instructions writes", () => {
  it("writes the rule where every agent already looks", () => {
    expect(ran("instructions")[0]).toBe(
      "AGENTS.md, CLAUDE.md and 1 rule file are written — an agent reading either now knows the rule and how to waive it"
    );
    expect(held("AGENTS.md")).toContain(
      'changing code a domain claims means updating that domain\'s book in the same commit, or waiving it with a "Skip-Docs: <reason>" trailer'
    );
    expect(held("AGENTS.md")).toContain("`domainbook/domains/ticketing/`");
    expect(held("AGENTS.md")).toContain("`src/ticketing/**`");
    expect(held("CLAUDE.md")).toBe("@AGENTS.md\n");
  });

  it("scopes a rule file to the globs the domain claims", () => {
    ran("instructions");
    expect(held(rule)).toContain('paths:\n  - "src/ticketing/**"');
    expect(held(rule)).toContain("domainbook/domains/ticketing/");
  });

  it("teaches the trailer key the repo chose", () => {
    wrote(
      "domainbook/domainbook.config.yaml",
      "enforcement:\n  trailer: Docs-Waiver\n"
    );
    ran("instructions");
    expect(held("AGENTS.md")).toContain('"Docs-Waiver: <reason>"');
  });

  it("prints the Gemini block for a person to paste and writes no settings", () => {
    const lines = ran("instructions");
    expect(lines).toContain('    "fileName": ["AGENTS.md", "GEMINI.md"]');
    expect(lines.at(-1)).toBe(
      "that block is yours to paste — domainbook does not edit a settings file it did not write"
    );
    expect(existsSync(".gemini/settings.json")).toBe(false);
  });

  it("points at the glossary rather than copying what it defines", () => {
    wrote(
      "domainbook/domains/ticketing/glossary.md",
      "# Glossary\n\n## Hold\n\nA seat kept out of sale.\n\n- **Status:** validated\n"
    );
    ran("instructions");
    expect(held("AGENTS.md")).toContain(
      "`domainbook/domains/ticketing/glossary.md`"
    );
    expect(held("AGENTS.md")).not.toContain("A seat kept out of sale");
  });

  it("gives a domain that claims nothing no rule file", () => {
    claims("reporting", "src/reporting/**");
    wrote(
      "domainbook/domains/reporting/index.md",
      held("domainbook/domains/reporting/index.md").replace(
        'code:\n  - "src/reporting/**"\n',
        ""
      )
    );
    ran("instructions");
    expect(existsSync(".claude/rules/domainbook-reporting.md")).toBe(false);
  });
});

describe("what regenerating replaces", () => {
  it("changes nothing when the book has not moved", () => {
    ran("instructions");
    const before = held("AGENTS.md");
    expect(ran("instructions")[0]).toBe(
      "AGENTS.md, CLAUDE.md and 1 rule file are up to date"
    );
    expect(held("AGENTS.md")).toBe(before);
  });

  it("leaves prose a person wrote around its own section", () => {
    ran("instructions");
    wrote("AGENTS.md", `A paragraph a person wrote.\n\n${held("AGENTS.md")}`);
    ran("instructions");
    expect(held("AGENTS.md").startsWith("A paragraph a person wrote.")).toBe(
      true
    );
  });

  it("leaves a CLAUDE.md that already imports AGENTS.md alone", () => {
    wrote("CLAUDE.md", "# House rules\n\nRun the tests.\n\n@AGENTS.md\n");
    ran("instructions");
    expect(held("CLAUDE.md")).toBe(
      "# House rules\n\nRun the tests.\n\n@AGENTS.md\n"
    );
  });

  it("takes the rule file of a domain that went away, and no other", () => {
    claims("billing", "src/billing/**");
    ran("instructions");
    wrote(".claude/rules/house-style.md", "# House style\n");
    expect(existsSync(".claude/rules/domainbook-billing.md")).toBe(true);
    rmSync("domainbook/domains/billing", { recursive: true });
    ran("instructions");
    expect(existsSync(".claude/rules/domainbook-billing.md")).toBe(false);
    expect(existsSync(".claude/rules/house-style.md")).toBe(true);
    expect(existsSync(rule)).toBe(true);
  });
});

describe("what --check says", () => {
  it("says the generated files are current, and writes nothing", () => {
    ran("instructions");
    expect(ran("instructions", "--check")).toEqual([
      "AGENTS.md, CLAUDE.md and 1 rule file are up to date",
    ]);
  });

  it("names a rule file a moved glob left behind, and writes nothing", () => {
    ran("instructions");
    const before = held(rule);
    wrote(
      "domainbook/domains/ticketing/index.md",
      held("domainbook/domains/ticketing/index.md").replace(
        "src/ticketing/**",
        "src/box-office/**"
      )
    );
    expect(failed("instructions", "--check")).toContain(
      `${rule} is out of date — run "domainbook instructions" to write it again`
    );
    expect(held(rule)).toBe(before);
  });

  it("does not call a rule file a person wrote stale", () => {
    ran("instructions");
    wrote(".claude/rules/house-style.md", "# House style\n");
    expect(
      ran("instructions", "--check").some((line) =>
        line.includes("house-style.md")
      )
    ).toBe(false);
  });
});

describe("what --check says before anyone has run it", () => {
  it("says there is nothing to keep current rather than naming files as stale", () => {
    expect(ran("instructions", "--check")).toEqual([
      'AGENTS.md is not here, so there is nothing to keep current — "domainbook instructions" writes it',
    ]);
  });
});
