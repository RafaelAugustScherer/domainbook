import { existsSync, readFileSync, rmSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { claims, enter, failed, leave, ran, wrote } from "./repo.js";

const file = ".mcp.json";

beforeEach(() => {
  enter();
  ran("init");
  claims("ticketing", "src/ticketing/**");
});

afterEach(leave);

function held(): Record<string, Record<string, unknown>> {
  return JSON.parse(readFileSync(file, "utf8")) as Record<
    string,
    Record<string, unknown>
  >;
}

function server(): { type?: string; command?: string; args?: string[] } {
  return held()["mcpServers"]?.["domainbook"] as {
    type?: string;
    command?: string;
    args?: string[];
  };
}

describe("what instructions writes for a client", () => {
  it("writes a stdio server that runs the CLI through npx", () => {
    rmSync(file);
    expect(ran("instructions")[1]).toBe(
      ".mcp.json is written — Claude Code in this repo can now ask the book questions"
    );
    expect(server()).toEqual({
      type: "stdio",
      command: "npx",
      args: ["-y", "domainbook", "serve", "mcp"],
    });
  });

  it("puts a book that lives somewhere else into the command", () => {
    ran("init", "docs/book");
    ran("instructions", "docs/book");
    expect(server().args).toEqual([
      "-y",
      "domainbook",
      "serve",
      "mcp",
      "docs/book",
    ]);
  });

  it("is written by init as well, so a fresh repo needs no second command", () => {
    leave();
    enter();
    expect(ran("init")[0]).toBe(
      "wrote domainbook/roadmap.md, domainbook/domainbook.config.yaml and .mcp.json"
    );
    expect(server().command).toBe("npx");
  });

  it("says it is up to date when nothing has moved", () => {
    ran("instructions");
    expect(ran("instructions")[1]).toBe(".mcp.json is up to date");
  });
});

describe("what instructions leaves alone in that file", () => {
  it("keeps a server someone else put there", () => {
    wrote(
      file,
      `${JSON.stringify(
        {
          mcpServers: { playwright: { command: "npx", args: ["playwright"] } },
        },
        undefined,
        2
      )}\n`
    );
    expect(ran("instructions")[1]).toBe(
      ".mcp.json already existed, so the domainbook server was added to it"
    );
    expect(Object.keys(held()["mcpServers"] ?? {}).sort()).toEqual([
      "domainbook",
      "playwright",
    ]);
    expect(held()["mcpServers"]?.["playwright"]).toEqual({
      command: "npx",
      args: ["playwright"],
    });
  });

  it("rewrites a domainbook entry a person changed, and says so", () => {
    ran("instructions");
    wrote(
      file,
      `${JSON.stringify(
        { mcpServers: { domainbook: { command: "node", args: ["mine.js"] } } },
        undefined,
        2
      )}\n`
    );
    expect(ran("instructions")[1]).toBe(
      "the domainbook entry in .mcp.json was rewritten"
    );
    expect(server().command).toBe("npx");
  });

  it("hands back a file that is not JSON rather than overwriting it", () => {
    wrote(file, "{ this is not json\n");
    expect(failed("instructions")).toEqual([
      ".mcp.json is not valid JSON, so it cannot be added to — fix it, or move it aside and run this again",
    ]);
    expect(readFileSync(file, "utf8")).toBe("{ this is not json\n");
  });
});

describe("what instructions prints for the other clients", () => {
  it("prints a block for each of the four, with the key each one reads", () => {
    const lines = ran("instructions").join("\n");
    expect(lines).toContain(".cursor/mcp.json");
    expect(lines).toContain(".vscode/mcp.json");
    expect(lines).toContain(".codex/config.toml");
    expect(lines).toContain(".gemini/settings.json");
    expect(lines).toContain("[mcp_servers.domainbook]");
    expect(lines).toContain('"servers": {');
    expect(lines).toContain('"mcpServers": {');
    expect(lines).toContain(
      "these four are yours to paste — domainbook does not edit a settings file it did not write"
    );
  });

  it("writes none of those four files", () => {
    ran("instructions");
    for (const path of [
      ".cursor/mcp.json",
      ".vscode/mcp.json",
      ".codex/config.toml",
      ".gemini/settings.json",
    ])
      expect(existsSync(path)).toBe(false);
  });
});

describe("what --check says about that file", () => {
  it("names the root it points at when the book has moved", () => {
    ran("init", "docs/book");
    ran("instructions", "docs/book");
    wrote(
      file,
      `${JSON.stringify(
        {
          mcpServers: {
            domainbook: {
              type: "stdio",
              command: "npx",
              args: ["-y", "domainbook", "serve", "mcp"],
            },
          },
        },
        undefined,
        2
      )}\n`
    );
    expect(failed("instructions", "--check", "docs/book")).toContain(
      '.mcp.json points at domainbook, which is not where the book is — run "domainbook instructions docs/book" to write it again'
    );
  });

  it("says nothing about it when it is current", () => {
    ran("instructions");
    expect(ran("instructions", "--check")).toEqual([
      "AGENTS.md, CLAUDE.md, 1 rule file and .mcp.json are up to date",
    ]);
  });
});
