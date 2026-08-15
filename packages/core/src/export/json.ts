import type {
  Book,
  DebtRecord,
  DecisionRecord,
  DomainRecord,
  FeatureRecord,
  GlossaryRecord,
} from "../model.js";
import type { Domain } from "../schemas/domain.js";
import type { Export } from "./types.js";

export function toModelJson(book: Book): Export {
  const model = {
    root: book.root,
    roadmap: book.roadmap?.frontmatter ?? null,
    glossary: terms(book.glossary),
    changelog: book.changelog?.changelog ?? null,
    decisions: book.decisions.map(decision),
    debt: book.debt.map(debt),
    domains: book.domains.flatMap((one) =>
      one.frontmatter === undefined ? [] : [domain(one, one.frontmatter)]
    ),
  };
  return {
    files: [
      { path: "book.json", content: `${JSON.stringify(model, null, 2)}\n` },
    ],
    notices: [],
  };
}

function terms(glossary: GlossaryRecord | undefined) {
  return (glossary?.terms ?? []).map((term) => ({
    slug: term.slug,
    name: term.name,
    definition: term.definition,
    aliases: term.aliases,
    examples: term.examples,
    status: term.status,
  }));
}

function decision(record: DecisionRecord) {
  return {
    ref: ref(record.domain, "ADR", record.number),
    number: record.number,
    title: record.title,
    ...record.frontmatter,
  };
}

function debt(record: DebtRecord) {
  return {
    ref: ref(record.domain, "TDR", record.number),
    number: record.number,
    title: record.title,
    ...record.frontmatter,
  };
}

function domain(record: DomainRecord, frontmatter: Domain) {
  return {
    ...frontmatter,
    glossary: terms(record.glossary),
    features: record.features.map(feature),
    decisions: record.decisions.map(decision),
    debt: record.debt.map(debt),
    changelog: record.changelog?.changelog ?? null,
  };
}

function feature(record: FeatureRecord) {
  return {
    ...record.frontmatter,
    story: record.story,
    rules: record.rules.map((rule) => ({
      name: rule.name,
      examples: rule.examples.map((example) => example.source),
    })),
  };
}

function ref(
  domain: string | undefined,
  kind: "ADR" | "TDR",
  number: number
): string {
  const named = `${kind}-${String(number).padStart(4, "0")}`;
  return domain === undefined ? named : `${domain}/${named}`;
}
