import type { Book, ContextMap, DomainRecord, Edge } from "@domainbook/core";
import { contextMap, sectionsOf } from "@domainbook/core";
import { type Answer, listed, refuse, said } from "../answer.js";
import { noDomain } from "../scope.js";

export function getDomain(book: Book, id: string): Answer {
  const domain = book.domains.find((one) => one.id === id);
  if (domain === undefined || domain.frontmatter === undefined)
    return refuse(noDomain(book, id));
  const { name, classification, code } = domain.frontmatter;
  return said(
    `# ${name} (${id})`,
    "",
    `${classification.domain} · ${classification["business-model"]} · ${classification.evolution}`,
    "",
    code === undefined
      ? "Claims no code."
      : `Claims ${code.map(fenced).join(", ")}.`,
    "",
    ...sectionsOf(domain.file).flatMap((section) => [
      `## ${section.heading}`,
      "",
      section.text,
      "",
    ]),
    "## What this context holds",
    "",
    ...holdings(domain)
  );
}

export function getContextMap(book: Book, domain?: string): Answer {
  if (book.domains.length === 0)
    return said(
      'this book has no domains yet — "domainbook new domain <id>" writes the first one'
    );
  if (domain !== undefined && !book.domains.some((one) => one.id === domain))
    return refuse(noDomain(book, domain));
  const map = contextMap(book, domain);
  return said(
    "# Context map",
    "",
    "## Contexts",
    "",
    ...map.contexts.map(
      (one) =>
        `- ${one.name} (${one.id}) — ${one.classification.domain}, ${one.classification["business-model"]}, ${one.classification.evolution}`
    ),
    "",
    "## Relationships",
    "",
    ...relationships(map)
  );
}

function fenced(glob: string): string {
  return `\`${glob}\``;
}

function relationships(map: ContextMap): string[] {
  if (map.edges.length === 0)
    return map.contexts.map((one) => `- ${one.id} is connected to nothing`);
  const joined = new Set(map.edges.flatMap((edge) => edge.between));
  return [
    ...map.edges.map(edge),
    ...map.contexts
      .filter((one) => !joined.has(one.id))
      .map((one) => `- ${one.id} is connected to nothing`),
  ];
}

function edge(one: Edge): string {
  const [left, right] = one.between;
  const patterns = one.patterns
    .map((held) => `${held.by}: ${held.names.join(", ")}`)
    .join("; ");
  const flow =
    one.upstream === undefined
      ? ""
      : ` — ${one.upstream} upstream, ${one.downstream} downstream`;
  return `- ${left} ↔ ${right}: ${one.type}${flow}${
    patterns === "" ? "" : ` (${patterns})`
  }`;
}

function holdings(domain: DomainRecord): string[] {
  const terms = domain.glossary?.terms.length ?? 0;
  return [
    domain.features.length === 0
      ? "- No features"
      : `- Features: ${listed(
          domain.features.map((one) => one.frontmatter.id)
        )} — read one with get_feature`,
    counted(domain.decisions.length, "decision", "get_decisions"),
    counted(domain.debt.length, "open or recorded debt record", "search_book"),
    terms === 0
      ? "- No glossary"
      : `- ${terms} terms — read them with explain_terms`,
    domain.changelog === undefined
      ? "- No changelog"
      : "- A changelog — read it with get_changelog",
  ];
}

function counted(total: number, what: string, tool: string): string {
  if (total === 0) return `- No ${what}s`;
  return `- ${total} ${what}${total === 1 ? "" : "s"} — read them with ${tool}`;
}
