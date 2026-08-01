import type { Book, DomainRecord } from "./model.js";
import type { Classification, Relationship } from "./schemas/domain.js";

export type Context = {
  id: string;
  name: string;
  classification: Classification;
};

export type Edge = {
  between: [string, string];
  type: Relationship["type"];
  upstream?: string;
  downstream?: string;
  patterns: { by: string; names: string[] }[];
};

export type ContextMap = { contexts: Context[]; edges: Edge[] };

export function contextMap(book: Book, domain?: string): ContextMap {
  const edges = edgesOf(book);
  if (domain === undefined) return { contexts: contexts(book.domains), edges };
  const near = edges.filter((edge) => edge.between.includes(domain));
  const ids = new Set([domain, ...near.flatMap((edge) => edge.between)]);
  return {
    contexts: contexts(book.domains.filter((one) => ids.has(one.id))),
    edges: near,
  };
}

function edgesOf(book: Book): Edge[] {
  const found = new Map<string, Edge>();
  for (const one of book.domains)
    for (const relationship of one.frontmatter?.relationships ?? []) {
      const between: [string, string] =
        one.id < relationship.with
          ? [one.id, relationship.with]
          : [relationship.with, one.id];
      const key = between.join(" ");
      found.set(key, joined(found.get(key), between, one.id, relationship));
    }
  return [...found.values()].sort((a, b) =>
    a.between.join(" ") < b.between.join(" ") ? -1 : 1
  );
}

function joined(
  held: Edge | undefined,
  between: [string, string],
  by: string,
  relationship: Relationship
): Edge {
  const edge: Edge = held ?? {
    between,
    type: relationship.type,
    patterns: [],
  };
  if ("direction" in relationship) {
    const other = between.find((id) => id !== by) ?? by;
    edge.upstream = relationship.direction === "upstream" ? by : other;
    edge.downstream = relationship.direction === "upstream" ? other : by;
  }
  if ("patterns" in relationship && relationship.patterns !== undefined)
    edge.patterns = [
      ...edge.patterns.filter((one) => one.by !== by),
      { by, names: relationship.patterns },
    ];
  return edge;
}

function contexts(domains: DomainRecord[]): Context[] {
  return domains.flatMap((one) =>
    one.frontmatter === undefined
      ? []
      : [
          {
            id: one.id,
            name: one.frontmatter.name,
            classification: one.frontmatter.classification,
          },
        ]
  );
}
