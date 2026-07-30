export type Node =
  | { kind: "heading"; depth: number; text: string; line: number }
  | { kind: "fence"; info: string; content: string; line: number; end: number }
  | { kind: "text"; text: string; line: number };

export type Heading = Extract<Node, { kind: "heading" }>;
export type Fence = Extract<Node, { kind: "fence" }>;
export type Text = Extract<Node, { kind: "text" }>;
export type Section = { heading: Heading; nodes: Node[] };
export type Item = { text: string; line: number };

const opener = /^\s*(`{3,}|~{3,})(.*)$/;
const title = /^(#{1,6})\s+(.*)$/;

export function parseMarkdown(body: string, first: number): Node[] {
  const nodes: Node[] = [];
  const lines = body.split(/\r?\n/);
  let index = 0;
  while (index < lines.length) {
    const text = lines[index] ?? "";
    const fence = opener.exec(text);
    const heading = title.exec(text);
    if (fence) {
      const marker = fence[1] ?? "```";
      const closer = new RegExp(`^\\s*${marker[0]}{${marker.length},}\\s*$`);
      let cursor = index + 1;
      while (cursor < lines.length && !closer.test(lines[cursor] ?? ""))
        cursor += 1;
      nodes.push({
        kind: "fence",
        info: (fence[2] ?? "").trim(),
        content: lines.slice(index + 1, cursor).join("\n"),
        line: first + index,
        end: first + Math.min(cursor, lines.length - 1),
      });
      index = cursor + 1;
      continue;
    }
    if (heading)
      nodes.push({
        kind: "heading",
        depth: (heading[1] ?? "").length,
        text: (heading[2] ?? "").trim(),
        line: first + index,
      });
    else nodes.push({ kind: "text", text, line: first + index });
    index += 1;
  }
  return nodes;
}

export function headings(nodes: Node[]): Heading[] {
  return nodes.filter((node) => node.kind === "heading");
}

export function sections(nodes: Node[], depth: number): Section[] {
  const found: Section[] = [];
  for (const node of nodes) {
    if (node.kind === "heading" && node.depth === depth) {
      found.push({ heading: node, nodes: [] });
      continue;
    }
    found.at(-1)?.nodes.push(node);
  }
  return found;
}

export function items(nodes: Node[]): Item[] {
  const found: Item[] = [];
  for (const node of nodes) {
    if (node.kind !== "text") continue;
    if (node.text.startsWith("- ")) {
      found.push({ text: node.text.slice(2).trim(), line: node.line });
      continue;
    }
    const last = found.at(-1);
    const text = node.text.trim();
    if (last !== undefined && text !== "") last.text = `${last.text} ${text}`;
  }
  return found;
}

export function prose(nodes: Node[]): string {
  return nodes
    .filter((node) => node.kind === "text")
    .map((node) => node.text.trim())
    .filter((text) => text !== "")
    .join(" ");
}
