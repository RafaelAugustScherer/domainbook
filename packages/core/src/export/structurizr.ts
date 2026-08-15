import { contextMap, type ContextMap, type Edge } from "../map.js";
import type { Book } from "../model.js";
import { identifier, mapNotices } from "./context-map.js";
import type { Export } from "./types.js";

export function toStructurizr(book: Book): Export {
  const map = contextMap(book);
  return {
    files: [{ path: "context-map.dsl", content: render(map) }],
    notices: mapNotices(map, "Structurizr has no non-directional edge for"),
  };
}

function render(map: ContextMap): string {
  const lines = ["workspace {", "\tmodel {"];
  for (const context of map.contexts)
    lines.push(
      `\t\t${identifier(context.id)} = softwareSystem "${context.name}"`
    );
  for (const edge of map.edges)
    if (edge.type !== "separate-ways") lines.push(`\t\t${relationship(edge)}`);
  lines.push(
    "\t}",
    "\tviews {",
    '\t\tsystemLandscape "landscape" {',
    "\t\t\tinclude *",
    "\t\t\tautoLayout",
    "\t\t}",
    "\t}",
    "}"
  );
  return `${lines.join("\n")}\n`;
}

function relationship(edge: Edge): string {
  if (edge.downstream !== undefined && edge.upstream !== undefined)
    return `${identifier(edge.downstream)} -> ${identifier(edge.upstream)}`;
  const [one, other] = edge.between.map(identifier);
  return `${one} -> ${other}`;
}
