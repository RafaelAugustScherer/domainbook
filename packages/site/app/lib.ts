import { getCollection, getEntry } from "astro:content";
export {
  changelogPath,
  dashedMeans,
  debtBadge,
  debtPath,
  decisionBadge,
  decisionPath,
  described,
  domainPath,
  drawMap,
  featureBadge,
  featurePath,
  glossaryPath,
  labelOf,
  mermaidSource,
  pad,
  termBadge,
  termPath,
  worstFirst,
  type Badge,
  type Link,
} from "@domainbook/site/app";

export type Kind =
  | "domains"
  | "features"
  | "decisions"
  | "debt"
  | "terms"
  | "changelogs";

export type Held = { id: string; data: Record<string, unknown> };

export async function collected(kind: Kind): Promise<Held[]> {
  const book = await getEntry("book", "book");
  const data = book?.data as { totals?: Record<string, number> } | undefined;
  if ((data?.totals?.[kind] ?? 0) === 0) return [];
  return getCollection(kind);
}

export function href(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base.replace(/\/$/, "")}${path}`;
}

export function titled(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
