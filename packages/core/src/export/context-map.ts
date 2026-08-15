import type { ContextMap, Edge } from "../map.js";
import { counted } from "./types.js";

export function tally(map: ContextMap): string {
  return `${counted(map.contexts.length, "domain")}, ${counted(
    map.edges.length,
    "relationship"
  )}`;
}

function separated(map: ContextMap): Edge[] {
  return map.edges.filter((edge) => edge.type === "separate-ways");
}

function pair(edge: Edge): string {
  return edge.between.join(" — ");
}

export function mapNotices(map: ContextMap, missing: string): string[] {
  const skipped = separated(map);
  const notices = [tally(map)];
  if (skipped.length > 0)
    notices.push(
      `skipped ${counted(
        skipped.length,
        "separate-ways relationship"
      )} ${missing}: ${skipped.map(pair).join(", ")}`
    );
  return notices;
}

export function identifier(id: string): string {
  const [head, ...rest] = id.split("-");
  return [
    head,
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)),
  ].join("");
}
