import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { goldenDir } from "./book.js";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const bin = join(repo, "packages/cli/dist/bin.js");

let dir: string;
let client: Client;

beforeAll(async () => {
  execFileSync("npm", ["run", "build"], { cwd: repo, timeout: 180_000 });
  dir = mkdtempSync(join(tmpdir(), "domainbook-serve-"));
  cpSync(goldenDir, join(dir, "domainbook"), { recursive: true });
  mkdirSync(join(dir, "src/ticketing/holds"), { recursive: true });
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [bin, "serve", "mcp"],
      cwd: dir,
      stderr: "pipe",
    })
  );
}, 240_000);

afterAll(async () => {
  await client?.close();
  if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
});

function textOf(result: unknown): string {
  const { content } = result as { content: { text?: string }[] };
  return content.map((one) => one.text ?? "").join("\n");
}

describe("a real client over real stdio", () => {
  it("connects and is told the server's name", () => {
    expect(client.getServerVersion()?.name).toBe("domainbook");
  });

  it("is offered the eight tools, every one of them read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((one) => one.name).sort()).toEqual([
      "explain_terms",
      "get_changelog",
      "get_context_map",
      "get_decisions",
      "get_domain",
      "get_feature",
      "search_book",
      "where_to_document",
    ]);
    expect(tools.every((one) => one.annotations?.readOnlyHint === true)).toBe(
      true
    );
    expect(tools.every((one) => (one.description ?? "").length > 0)).toBe(true);
  });

  it("answers what a term means and which features touch it", async () => {
    const said = textOf(
      await client.callTool({
        name: "explain_terms",
        arguments: { names: ["hold"] },
      })
    );
    expect(said).toContain("A claim on named seats");
    expect(said).toContain("- Used by hold-seats-during-checkout");
  });

  it("answers where a change belongs", async () => {
    const said = textOf(
      await client.callTool({
        name: "where_to_document",
        arguments: { paths: ["src/ticketing/hold.ts"] },
      })
    );
    expect(said).toContain("## ticketing");
    expect(said).toContain("domainbook/domains/ticketing/");
  });

  it("takes a folder as scope, without a file inside it being named", async () => {
    const said = textOf(
      await client.callTool({
        name: "get_decisions",
        arguments: { paths: ["src/ticketing"] },
      })
    );
    expect(said).toContain("- ticketing/ADR-0001 — ");
    expect(said).not.toContain("- ADR-0001 — ");
  });

  it("lists the book as resources and reads one back byte for byte", async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((one) => one.uri);
    expect(uris).toContain("domainbook://domains/ticketing/index.md");
    expect(uris).toContain("domainbook://glossary.md");
    expect(uris).not.toContain(
      "domainbook://domains/ticketing/decisions/0002-reject-a-capture-that-lands-after-the-hold-expired.md"
    );
    const read = await client.readResource({
      uri: "domainbook://domains/ticketing/index.md",
    });
    const [first] = read.contents;
    expect(first !== undefined && "text" in first ? first.text : "").toContain(
      "id: ticketing"
    );
  });

  it("answers a book edited on disk without being restarted", async () => {
    appendFileSync(
      join(dir, "domainbook/domains/ticketing/glossary.md"),
      "\n## Row Lock\n\nA claim on a whole row for a group booking.\n\n- **Status:** draft\n"
    );
    const said = textOf(
      await client.callTool({
        name: "explain_terms",
        arguments: { names: ["row lock"] },
      })
    );
    expect(said).toContain("A claim on a whole row");
  });

  it("marks a refusal as an error rather than answering", async () => {
    const answer = await client.callTool({
      name: "get_domain",
      arguments: { id: "shipping" },
    });
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain('no domain "shipping" in this book');
  });
});

describe("what serve refuses before it starts", () => {
  it("names the phase the site comes in", () => {
    const answer = ran(["serve", "web"]);
    expect(answer.status).toBe(1);
    expect(answer.stderr).toContain(
      '"web" is not something "domainbook serve" does yet'
    );
  });

  it("names init when there is no book", () => {
    const empty = mkdtempSync(join(tmpdir(), "domainbook-empty-"));
    const answer = ran(["serve", "mcp"], empty);
    expect(answer.status).toBe(1);
    expect(answer.stderr).toContain(
      'domainbook: no book here — run "domainbook init domainbook" to write one'
    );
    rmSync(empty, { recursive: true, force: true });
  });
});

function ran(
  args: string[],
  cwd?: string
): { status: number | null; stderr: string } {
  try {
    execFileSync(process.execPath, [bin, ...args], {
      cwd: cwd ?? dir,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 20_000,
    });
    return { status: 0, stderr: "" };
  } catch (thrown) {
    const error = thrown as { status: number | null; stderr: string };
    return { status: error.status, stderr: error.stderr };
  }
}
