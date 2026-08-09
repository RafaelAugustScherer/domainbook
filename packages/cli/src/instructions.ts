import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { loadBook, type Book, type DomainRecord } from "@domainbook/core";
import { entries, missingBook, relate, write } from "./files.js";
import {
  mcpFile,
  type Planned,
  planServer,
  rootOf,
  same,
  snippets,
} from "./mcp.js";
import { refuse, type Result } from "./result.js";

type Generated = { file: string; text: string };

const start = "<!-- domainbook:start -->";
const end = "<!-- domainbook:end -->";

const rules = ".claude/rules";
const ours = "domainbook-";

const gemini = [
  "Gemini CLI reads GEMINI.md — add AGENTS.md to .gemini/settings.json so it reads this book's rule too:",
  "",
  "{",
  '  "context": {',
  '    "fileName": ["AGENTS.md", "GEMINI.md"]',
  "  }",
  "}",
  "",
  "that block is yours to paste — domainbook does not edit a settings file it did not write",
];

export function instructions(root: string, only: boolean): Result {
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const at = relate(resolve(root));
  const { book } = loadBook(root);
  const planned = plan(book, at);
  const departed = strays(planned);
  const server = planServer(at);
  if ("refusal" in server) return refuse(server.refusal);
  return only
    ? audit(planned, departed, server, at)
    : apply(planned, departed, server, at);
}

function plan(book: Book, at: string): Generated[] {
  const claiming = book.domains.filter(
    (domain) => (domain.frontmatter?.code ?? []).length > 0
  );
  return [
    { file: "AGENTS.md", text: agents(book, at, claiming) },
    { file: "CLAUDE.md", text: claude() },
    ...claiming.map((domain) => ({
      file: `${rules}/${ours}${domain.id}.md`,
      text: rule(domain, at, book.config.enforcement.trailer),
    })),
  ];
}

function apply(
  planned: Generated[],
  departed: string[],
  server: Planned,
  at: string
): Result {
  const changed = planned.filter((one) => readOr(one.file) !== one.text);
  for (const one of changed) {
    const refusal = write(resolve(one.file), one.text);
    if (refusal !== undefined) return refuse(refusal);
  }
  for (const file of departed) rmSync(file);
  const current = same(server.server, server.held);
  if (!current) {
    const refusal = write(resolve(mcpFile), server.text);
    if (refusal !== undefined) return refuse(refusal);
  }
  const said = listed(planned);
  return {
    code: 0,
    lines: [
      changed.length === 0 && departed.length === 0
        ? `${said} are up to date`
        : `${said} are written — an agent reading either now knows the rule and how to waive it`,
      wroteServer(server, current),
      "",
      ...snippets(at),
      "",
      ...gemini,
    ],
  };
}

function wroteServer(server: Planned, current: boolean): string {
  if (current) return `${mcpFile} is up to date`;
  if (server.held !== undefined)
    return `the domainbook entry in ${mcpFile} was rewritten`;
  if (server.existed)
    return `${mcpFile} already existed, so the domainbook server was added to it`;
  return `${mcpFile} is written — Claude Code in this repo can now ask the book questions`;
}

function audit(
  planned: Generated[],
  departed: string[],
  server: Planned,
  at: string
): Result {
  if (!existsSync("AGENTS.md"))
    return {
      code: 0,
      lines: [
        'AGENTS.md is not here, so there is nothing to keep current — "domainbook instructions" writes it',
      ],
    };
  const stale = [
    ...planned
      .filter((one) => readOr(one.file) !== one.text)
      .map((one) => one.file),
    ...departed,
  ].sort();
  const drifted = same(server.server, server.held)
    ? []
    : [serverStale(server, at)];
  if (stale.length === 0 && drifted.length === 0)
    return {
      code: 0,
      lines: [`${listed(planned, mcpFile)} are up to date`],
    };
  return {
    code: 1,
    lines: [
      ...stale.map(
        (file) =>
          `${file} is out of date — run "domainbook instructions" to write it again`
      ),
      ...drifted,
    ],
  };
}

function serverStale(server: Planned, at: string): string {
  const rooted = at === "domainbook" ? "" : ` ${at}`;
  if (server.held === undefined)
    return `${mcpFile} carries no domainbook server — run "domainbook instructions${rooted}" to write it`;
  return `${mcpFile} points at ${rootOf(
    server.held
  )}, which is not where the book is — run "domainbook instructions${rooted}" to write it again`;
}

function strays(planned: Generated[]): string[] {
  if (!existsSync(rules)) return [];
  const written = new Set(planned.map((one) => one.file));
  return entries(rules)
    .filter((name) => name.startsWith(ours) && name.endsWith(".md"))
    .map((name) => `${rules}/${name}`)
    .filter((file) => !written.has(file));
}

function agents(book: Book, at: string, claiming: DomainRecord[]): string {
  const section = [start, ...body(book, at, claiming), end].join("\n");
  const before = readOr("AGENTS.md");
  if (before === undefined) return `${section}\n`;
  const from = before.indexOf(start);
  const to = before.indexOf(end);
  if (from === -1 || to === -1) return `${before.trimEnd()}\n\n${section}\n`;
  return `${before.slice(0, from)}${section}${before.slice(to + end.length)}`;
}

function body(book: Book, at: string, claiming: DomainRecord[]): string[] {
  const key = book.config.enforcement.trailer;
  return [
    "",
    "## Documentation lives in this repo",
    "",
    `The book under \`${at}/\` documents this codebase, and a commit hook checks it. The rule: changing code a domain claims means updating that domain's book in the same commit, or waiving it with a "${key}: <reason>" trailer.`,
    "",
    ...mapped(at, claiming),
    `Any file under a domain's folder clears the check for that domain — the canvas, the glossary, the changelog, a feature, a decision, or a debt record. A change across several domains updates each of their books, or carries one record at the book root: a decision under \`${at}/decisions/\` or an entry in \`${at}/changelog.md\`.`,
    "",
    ...vocabulary(at, claiming),
    ...procedures(),
    "To waive a commit, end the commit message with a trailer saying what makes the change safe to leave undocumented:",
    "",
    "```",
    `${key}: renamed a private helper, no behaviour or vocabulary changed`,
    "```",
    "",
  ];
}

function mapped(at: string, claiming: DomainRecord[]): string[] {
  if (claiming.length === 0) return [];
  return [
    "| Code | Book |",
    "| --- | --- |",
    ...claiming.map(
      (domain) =>
        `| ${(domain.frontmatter?.code ?? [])
          .map((glob) => `\`${glob}\``)
          .join(", ")} | \`${at}/domains/${domain.id}/\` |`
    ),
    "",
  ];
}

function vocabulary(at: string, claiming: DomainRecord[]): string[] {
  if (claiming.length === 0) return [];
  const written = claiming.filter((domain) => domain.glossary !== undefined);
  return [
    "Before you name anything, look the word up and use the one this book already has. The book answers over MCP: call `explain_terms` with the words you are about to use, and `where_to_document` with the paths you are changing. `domainbook serve mcp` starts the server if your client is not connected to it.",
    "",
    ...(written.length === 0
      ? []
      : [
          "Without MCP, the words are written down here:",
          "",
          ...written.map(
            (domain) => `- \`${at}/domains/${domain.id}/glossary.md\``
          ),
          "",
        ]),
  ];
}

function procedures(): string[] {
  return [
    "When a change means the book has to change too, these procedures say how — reach for the one that fits, and follow its steps there rather than from here:",
    "",
    "- `migrate-a-repo` — start a book in a repo that has none.",
    "- `document-this-change` — write the book change a commit or a Stop block is asking for.",
    "- `record-a-decision` — decide whether a choice earns a decision record, and write it if it does.",
    "- `groom-the-glossary` — bring the glossary back in line with the words the code uses.",
    "",
  ];
}

function rule(domain: DomainRecord, at: string, key: string): string {
  const code = domain.frontmatter?.code ?? [];
  const book = `${at}/domains/${domain.id}`;
  return [
    "---",
    "paths:",
    ...code.map((glob) => `  - "${glob}"`),
    "---",
    "",
    `# ${domain.frontmatter?.name ?? domain.id}`,
    "",
    `Code here is claimed by the ${domain.id} domain. Changing it means updating \`${book}/\` in the same commit, or waiving the commit with a "${key}: <reason>" trailer. Any file under that folder clears the check: the canvas, the glossary, the changelog, a feature, a decision, or a debt record.`,
    "",
    `Before you name anything here, call \`explain_terms\` with the words you are about to use — this context has its own, and they win over the book's. \`${book}/index.md\` holds its canvas.${
      domain.glossary === undefined
        ? ""
        : ` Without MCP, its words are in \`${book}/glossary.md\`.`
    }`,
    "",
  ].join("\n");
}

function claude(): string {
  const before = readOr("CLAUDE.md");
  if (before === undefined) return "@AGENTS.md\n";
  if (before.includes("@AGENTS.md")) return before;
  return `${before.trimEnd()}\n\n@AGENTS.md\n`;
}

function listed(planned: Generated[], ...extra: string[]): string {
  const count = planned.filter((one) => one.file.startsWith(rules)).length;
  const parts = [
    "AGENTS.md",
    "CLAUDE.md",
    ...(count === 0 ? [] : [`${count} rule file${count === 1 ? "" : "s"}`]),
    ...extra,
  ];
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

function readOr(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}
