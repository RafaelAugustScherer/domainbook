import type { Context, ContextMap, Edge } from "@domainbook/core";
import { labelOf } from "./map.js";

type Placed = Context & { x: number; y: number; depth: number };

type Point = { x: number; y: number };

type Drawn = { points: Point[]; label: Point };

const box = { width: 188, height: 76 };
const gap = { row: 116, col: 52 };
const pad = 28;
const aside = 40;

export function drawMap(map: ContextMap, at: (id: string) => string): string {
  const placed = place(map.contexts, map.edges);
  const found = new Map(placed.map((one) => [one.id, one]));
  const routed = map.edges
    .map((edge) => ({ edge, ends: endsOf(edge, found) }))
    .filter((one) => one.ends !== undefined);
  const lanes = laned(routed.map((one) => corridorOf(one.ends!)));
  const arrivals = laned(routed.map((one) => one.ends!.to.id));
  const sides = spread(placed);
  const drawn = routed.map((one, index) =>
    route(one.ends!, lanes[index] ?? 0, arrivals[index] ?? 0, sides)
  );
  const frame = viewBox(placed, drawn);
  return [
    `<svg class="map" viewBox="${frame}" role="img" aria-labelledby="map-title map-desc" xmlns="http://www.w3.org/2000/svg">`,
    `<title id="map-title">Context map</title>`,
    `<desc id="map-desc">${escaped(described(map))}</desc>`,
    arrowhead(),
    ...routed.map((one, index) => drawEdge(one.edge, drawn[index]!, one.ends!)),
    ...placed.map((one) => drawContext(one, at)),
    "</svg>",
  ].join("\n");
}

export function described(map: ContextMap): string {
  if (map.edges.length === 0)
    return `${counted(map.contexts.length)}, none of them connected.`;
  const each = map.edges.map((edge) => {
    const [one, other] = edge.between;
    if (edge.upstream === undefined)
      return `${one} and ${other}: ${labelOf(edge)}`;
    return `${edge.upstream} upstream of ${edge.downstream}: ${labelOf(edge)}`;
  });
  return `${counted(map.contexts.length)}. ${each.join(". ")}.`;
}

function counted(total: number): string {
  return `${total} context${total === 1 ? "" : "s"}`;
}

function place(contexts: Context[], edges: Edge[]): Placed[] {
  const step = box.width + gap.col;
  return layered(contexts, edges).flatMap((row, depth) =>
    row.map((one, index) => ({
      ...one,
      depth,
      x: Math.round((index - (row.length - 1) / 2) * step),
      y: depth * (box.height + gap.row),
    }))
  );
}

function layered(contexts: Context[], edges: Edge[]): Context[][] {
  const depth = new Map(contexts.map((one) => [one.id, 0]));
  const flows = edges.filter(
    (edge) => edge.upstream !== undefined && edge.downstream !== undefined
  );
  for (let pass = 0; pass < contexts.length; pass += 1) {
    let moved = false;
    for (const edge of flows) {
      const above = depth.get(edge.upstream ?? "");
      const below = depth.get(edge.downstream ?? "");
      if (above === undefined || below === undefined) continue;
      if (below > above) continue;
      depth.set(edge.downstream ?? "", above + 1);
      moved = true;
    }
    if (!moved) break;
  }
  const rows: Context[][] = [];
  for (const one of contexts) {
    const at = depth.get(one.id) ?? 0;
    const row = rows[at] ?? [];
    row.push(one);
    rows[at] = row;
  }
  return rows.filter((row) => row !== undefined && row.length > 0);
}

function endsOf(
  edge: Edge,
  found: Map<string, Placed>
): { from: Placed; to: Placed; directed: boolean } | undefined {
  const directed = edge.upstream !== undefined && edge.downstream !== undefined;
  const [one, other] = edge.between;
  const from = found.get(directed ? edge.upstream ?? one : one);
  const to = found.get(directed ? edge.downstream ?? other : other);
  if (from === undefined || to === undefined) return undefined;
  return { from, to, directed };
}

function corridorOf(ends: { from: Placed; to: Placed }): string {
  return `row-${Math.min(ends.from.depth, ends.to.depth)}`;
}

function laned(keys: string[]): number[] {
  const seen = new Map<string, number>();
  return keys.map((key) => {
    const next = seen.get(key) ?? 0;
    seen.set(key, next + 1);
    return next;
  });
}

function spread(placed: Placed[]): { left: number; right: number } {
  const xs = placed.map((one) => one.x);
  return {
    left: Math.min(...xs) - box.width / 2 - aside,
    right: Math.max(...xs) + box.width / 2 + aside,
  };
}

function corridor(depth: number, lane: number): number {
  const below = depth * (box.height + gap.row) + box.height / 2;
  return Math.round(below + 24 + (lane % 4) * 22);
}

function route(
  ends: { from: Placed; to: Placed },
  lane: number,
  arrive: number,
  sides: { left: number; right: number }
): Drawn {
  const { from, to } = ends;
  const apart = Math.abs(from.depth - to.depth);
  if (apart === 0) return alongside(from, to, lane);
  if (apart === 1) return between(from, to, lane, arrive);
  return sidestep(from, to, lane, arrive, sides);
}

function alongside(from: Placed, to: Placed, lane: number): Drawn {
  const near = box.width + gap.col + 1;
  if (Math.abs(to.x - from.x) <= near) {
    const side = from.x < to.x ? 1 : -1;
    const start = { x: from.x + (side * box.width) / 2, y: from.y };
    const end = { x: to.x - (side * box.width) / 2, y: to.y };
    return { points: [start, end], label: middle(start, end) };
  }
  const y = corridor(from.depth, lane);
  const start = { x: from.x, y: from.y + box.height / 2 };
  const end = { x: to.x, y: to.y + box.height / 2 };
  return {
    points: [start, { x: from.x, y }, { x: to.x, y }, end],
    label: middle({ x: from.x, y }, { x: to.x, y }),
  };
}

function between(
  from: Placed,
  to: Placed,
  lane: number,
  arrive: number
): Drawn {
  const down = to.depth > from.depth;
  const start = { x: from.x, y: from.y + (down ? 1 : -1) * (box.height / 2) };
  if (from.x === to.x) {
    const end = { x: to.x, y: to.y - (down ? 1 : -1) * (box.height / 2) };
    return { points: [start, end], label: middle(start, end) };
  }
  const into = to.x + nudge(arrive);
  const end = { x: into, y: to.y - (down ? 1 : -1) * (box.height / 2) };
  const y = corridor(down ? from.depth : to.depth, lane);
  const one = { x: from.x, y };
  const other = { x: into, y };
  return { points: [start, one, other, end], label: middle(one, other) };
}

const nudges = [-26, 26, -52, 52];

function nudge(arrive: number): number {
  return nudges[arrive % nudges.length] ?? 0;
}

function sidestep(
  from: Placed,
  to: Placed,
  lane: number,
  arrive: number,
  sides: { left: number; right: number }
): Drawn {
  const down = to.depth > from.depth;
  const top = down ? from : to;
  const bottom = down ? to : from;
  const rightwards = top.x + bottom.x >= 0;
  const edge = rightwards
    ? sides.right + (lane % 3) * 26
    : sides.left - (lane % 3) * 26;
  const first = corridor(top.depth, lane);
  const last = corridor(bottom.depth - 1, lane);
  const topX = down ? from.x : to.x + nudge(arrive);
  const bottomX = down ? to.x + nudge(arrive) : from.x;
  const points = [
    { x: topX, y: top.y + box.height / 2 },
    { x: topX, y: first },
    { x: edge, y: first },
    { x: edge, y: last },
    { x: bottomX, y: last },
    { x: bottomX, y: bottom.y - box.height / 2 },
  ];
  return {
    points: down ? points : [...points].reverse(),
    label: middle({ x: topX, y: first }, { x: edge, y: first }),
  };
}

function middle(one: Point, other: Point): Point {
  return {
    x: Math.round((one.x + other.x) / 2),
    y: Math.round((one.y + other.y) / 2),
  };
}

function viewBox(placed: Placed[], drawn: Drawn[]): string {
  const xs = [
    ...placed.flatMap((one) => [one.x - box.width / 2, one.x + box.width / 2]),
    ...drawn.flatMap((one) => one.points.map((point) => point.x)),
  ];
  const ys = [
    ...placed.flatMap((one) => [
      one.y - box.height / 2,
      one.y + box.height / 2,
    ]),
    ...drawn.flatMap((one) => one.points.map((point) => point.y)),
  ];
  const left = Math.min(...xs) - pad;
  const top = Math.min(...ys) - pad;
  const width = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const height = Math.max(...ys) - Math.min(...ys) + pad * 2;
  return `${left} ${top} ${width} ${height}`;
}

function drawContext(one: Placed, at: (id: string) => string): string {
  const x = one.x - box.width / 2;
  const y = one.y - box.height / 2;
  const { domain, "business-model": model, evolution } = one.classification;
  return [
    `<a href="${escaped(at(one.id))}" class="node">`,
    `<rect x="${x}" y="${y}" width="${box.width}" height="${box.height}" rx="8" />`,
    `<text x="${one.x}" y="${y + 26}" class="node-name">${escaped(
      one.name
    )}</text>`,
    `<text x="${one.x}" y="${y + 45}" class="node-axis">${escaped(
      domain
    )}</text>`,
    `<text x="${one.x}" y="${y + 62}" class="node-axis">${escaped(
      `${model} · ${evolution}`
    )}</text>`,
    "</a>",
  ].join("");
}

function drawEdge(
  edge: Edge,
  drawn: Drawn,
  ends: { from: Placed; to: Placed }
): string {
  const directed = edge.upstream !== undefined && edge.downstream !== undefined;
  const separate = edge.type === "separate-ways";
  const points = drawn.points.map((one) => `${one.x},${one.y}`).join(" ");
  const line = `<polyline points="${points}" class="edge${
    separate ? " edge-apart" : ""
  }"${directed ? ' marker-end="url(#arrow)"' : ""} />`;
  const label = `<text x="${drawn.label.x}" y="${
    drawn.label.y
  }" class="edge-label">${escaped(edge.type)}</text>`;
  return `${line}${label}${patterns(edge, drawn, ends)}`;
}

function patterns(
  edge: Edge,
  drawn: Drawn,
  ends: { from: Placed; to: Placed }
): string {
  return edge.patterns
    .map((pattern) => {
      const at = along(drawn.points, pattern.by === ends.to.id);
      return `<text x="${at.x}" y="${at.y}" class="edge-pattern">${escaped(
        pattern.names.join("/")
      )}</text>`;
    })
    .join("");
}

function along(points: Point[], fromTheEnd: boolean): Point {
  const ordered = fromTheEnd ? [...points].reverse() : points;
  const [end, next] = ordered;
  if (end === undefined || next === undefined) return { x: 0, y: 0 };
  const run = Math.hypot(next.x - end.x, next.y - end.y) || 1;
  const step = Math.min(22, run / 2);
  return {
    x: Math.round(end.x + ((next.x - end.x) / run) * step),
    y: Math.round(end.y + ((next.y - end.y) / run) * step - 7),
  };
}

function arrowhead(): string {
  return [
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"',
    ' markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '<path d="M 0 0 L 10 5 L 0 10 z" class="arrow" /></marker></defs>',
  ].join("");
}

function escaped(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
