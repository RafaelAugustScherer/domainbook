import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import type { Book } from "@domainbook/core";
import * as z from "zod";
import { type Answer, refuse } from "./answer.js";
import { open } from "./book.js";
import { listing, read, scheme } from "./resources.js";
import { getChangelog } from "./tools/changelog.js";
import { getDecisions } from "./tools/decisions.js";
import { getContextMap, getDomain } from "./tools/domain.js";
import { whereToDocument } from "./tools/document.js";
import { getFeature } from "./tools/feature.js";
import { type Kind, searchBook } from "./tools/search.js";
import { explainTerms } from "./tools/terms.js";

const kinds = [
  "roadmap",
  "glossary",
  "changelog",
  "domain",
  "feature",
  "decision",
  "debt",
] as const;

const reads = { readOnlyHint: true, destructiveHint: false } as const;

const cacheHint = { ttlMs: 5000, cacheScope: "private" } as const;

export function createServer(root: string, version: string): McpServer {
  const server = new McpServer(
    { name: "domainbook", version },
    { capabilities: { tools: {}, resources: {} } }
  );
  register(server, root);
  return server;
}

function register(server: McpServer, root: string): void {
  const answering = (give: (book: Book) => Answer) => () => {
    const opened = open(root);
    return "refusal" in opened ? refuse(opened.refusal) : give(opened.book);
  };

  server.registerTool(
    "search_book",
    {
      description:
        "Find where something is written in the book. Returns locators — artifact type, id, file and line — not bodies. Fetch what you find with get_domain, get_feature or get_decisions.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("text to look for, matched case-insensitively"),
        kind: z.enum(kinds).optional().describe("narrow to one artifact type"),
        domain: z
          .string()
          .optional()
          .describe("narrow to one context's artifacts"),
      }),
      annotations: { ...reads, title: "Search the book" },
    },
    ({ query, kind, domain }) =>
      answering((book) =>
        searchBook(book, query, { kind: kind as Kind | undefined, domain })
      )()
  );

  server.registerTool(
    "explain_terms",
    {
      description:
        "What this codebase means by a word, and which features use it. Reach for this before naming anything. Several words in one call.",
      inputSchema: z.object({
        names: z.array(z.string()).describe("the words to explain"),
        domain: z
          .string()
          .optional()
          .describe("the context asking, when a word means two things"),
      }),
      annotations: { ...reads, title: "Explain a term" },
    },
    ({ names, domain }) =>
      answering((book) => explainTerms(book, names, domain))()
  );

  server.registerTool(
    "get_domain",
    {
      description:
        "One bounded context: its canvas, the code it claims, and an index of what it holds.",
      inputSchema: z.object({ id: z.string().describe("the domain id") }),
      annotations: { ...reads, title: "Read a domain" },
    },
    ({ id }) => answering((book) => getDomain(book, id))()
  );

  server.registerTool(
    "get_context_map",
    {
      description:
        "How the contexts relate: every relationship declared by either side, once, with direction and patterns.",
      inputSchema: z.object({
        domain: z
          .string()
          .optional()
          .describe("narrow to one context and its neighbours"),
      }),
      annotations: { ...reads, title: "Read the context map" },
    },
    ({ domain }) => answering((book) => getContextMap(book, domain))()
  );

  server.registerTool(
    "get_feature",
    {
      description:
        "One feature whole — its story, rules and Gherkin examples as written. This is where behaviour is specified.",
      inputSchema: z.object({
        id: z.string().describe("the feature id"),
        domain: z
          .string()
          .optional()
          .describe("the context it belongs to, when two hold the same id"),
      }),
      annotations: { ...reads, title: "Read a feature" },
    },
    ({ id, domain }) => answering((book) => getFeature(book, id, domain))()
  );

  server.registerTool(
    "get_decisions",
    {
      description:
        "What has already been decided, as an index of one line per record. Scope it to a domain or to the paths you are changing; pass ids to read records in full. Superseded and rejected records are left out unless named.",
      inputSchema: z.object({
        domain: z.string().optional().describe("scope to one context's log"),
        paths: z
          .array(z.string())
          .optional()
          .describe("scope to the contexts claiming these repo-relative paths"),
        ids: z
          .array(z.string())
          .optional()
          .describe(
            'read these records in full, as "ADR-0001" or "billing/ADR-0004"'
          ),
        all: z.boolean().optional().describe("read every decision in the book"),
      }),
      annotations: { ...reads, title: "Ask what was decided" },
    },
    (asked) => answering((book) => getDecisions(book, asked))()
  );

  server.registerTool(
    "get_changelog",
    {
      description:
        "What changed, newest release first, as written. Scope it to a domain or to the paths you are changing; name a version or a date to reach older releases.",
      inputSchema: z.object({
        domain: z
          .string()
          .optional()
          .describe("scope to one context's changelog"),
        paths: z
          .array(z.string())
          .optional()
          .describe("scope to the contexts claiming these repo-relative paths"),
        version: z.string().optional().describe("read this release instead"),
        since: z
          .string()
          .optional()
          .describe("read every release dated on or after this YYYY-MM-DD"),
        all: z
          .boolean()
          .optional()
          .describe("read every changelog in the book"),
      }),
      annotations: { ...reads, title: "Ask what changed" },
    },
    (asked) => answering((book) => getChangelog(book, asked))()
  );

  server.registerTool(
    "where_to_document",
    {
      description:
        "Given the repo-relative paths you are changing, which book files that change belongs in. The same check the commit hook runs, so the two cannot disagree.",
      inputSchema: z.object({
        paths: z
          .array(z.string())
          .describe("repo-root-relative paths, changed or about to be"),
      }),
      annotations: { ...reads, title: "Ask where to document" },
    },
    ({ paths }) => answering((book) => whereToDocument(book, paths))()
  );

  server.registerResource(
    "book",
    new ResourceTemplate(`${scheme}{+path}`, {
      list: () => {
        const opened = open(root);
        return { resources: "refusal" in opened ? [] : listing(opened.book) };
      },
    }),
    {
      title: "The book",
      description:
        "Every artifact in this repo's book, addressed by its path inside it",
      mimeType: "text/markdown",
      cacheHint,
    },
    (uri) => {
      const opened = open(root);
      if ("refusal" in opened) return { contents: [] };
      const source = read(opened.book, uri.href);
      if (source === undefined) return { contents: [] };
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: source }],
      };
    }
  );
}
