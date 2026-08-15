import { contextMap, type ContextMap, type Edge } from "../map.js";
import type { Book } from "../model.js";
import { identifier, mapNotices } from "./context-map.js";
import type { Export } from "./types.js";

export function toCml(book: Book): Export {
  const map = contextMap(book);
  return {
    files: [{ path: "context-map.cml", content: render(map) }],
    notices: mapNotices(map, "Context Mapper has no production for"),
  };
}

function render(map: ContextMap): string {
  const lines: string[] = [];
  for (const context of map.contexts)
    lines.push(`BoundedContext ${identifier(context.id)}`);
  lines.push("", "ContextMap {");
  for (const context of map.contexts)
    lines.push(`\tcontains ${identifier(context.id)}`);
  for (const edge of map.edges)
    if (edge.type !== "separate-ways") lines.push(`\t${relationship(edge)}`);
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

function relationship(edge: Edge): string {
  const [one, other] = edge.between.map(identifier);
  if (edge.type === "partnership") return `${one} [P]<->[P] ${other}`;
  if (edge.type === "shared-kernel") return `${one} [SK]<->[SK] ${other}`;
  const supplier = edge.type === "customer-supplier";
  const down = roles(
    "D",
    supplier ? "C" : undefined,
    patternsBy(edge, edge.downstream)
  );
  const up = roles(
    "U",
    supplier ? "S" : undefined,
    patternsBy(edge, edge.upstream)
  );
  return `${identifier(
    edge.downstream ?? edge.between[0]
  )} [${down}]<-[${up}] ${identifier(edge.upstream ?? edge.between[1])}`;
}

function roles(
  side: string,
  role: string | undefined,
  patterns: string[]
): string {
  return [side, ...(role === undefined ? [] : [role]), ...patterns].join(",");
}

function patternsBy(edge: Edge, who: string | undefined): string[] {
  return edge.patterns.find((one) => one.by === who)?.names ?? [];
}
