import type { ContextMap, Edge } from "@domainbook/core";

export const dashedMeans =
  "a dashed edge is separate-ways — the two contexts deliberately do not integrate";

export function mermaidSource(
  map: ContextMap,
  at: (id: string) => string
): string {
  const ids = new Map(map.contexts.map((one, index) => [one.id, `n${index}`]));
  const lines = ["flowchart LR"];
  for (const context of map.contexts)
    lines.push(`  ${ids.get(context.id)}[${quoted(context.name)}]`);
  for (const edge of map.edges) lines.push(`  ${drawn(edge, ids)}`);
  for (const context of map.contexts)
    lines.push(`  click ${ids.get(context.id)} ${quoted(at(context.id))}`);
  return lines.join("\n");
}

export function labelOf(edge: Edge): string {
  const named = edge.patterns
    .filter((one) => one.names.length > 0)
    .map((one) => `${one.names.join(", ")} by ${one.by}`);
  return [edge.type, ...named].join(" · ");
}

function drawn(edge: Edge, ids: Map<string, string>): string {
  const [one, other] = edge.between;
  const label = quoted(labelOf(edge));
  if (edge.type === "separate-ways")
    return `${ids.get(one)} -.-|${label}| ${ids.get(other)}`;
  if (edge.upstream === undefined || edge.downstream === undefined)
    return `${ids.get(one)} ---|${label}| ${ids.get(other)}`;
  return `${ids.get(edge.upstream)} -->|${label}| ${ids.get(edge.downstream)}`;
}

function quoted(text: string): string {
  return `"${text.replace(/"/g, "#quot;")}"`;
}
