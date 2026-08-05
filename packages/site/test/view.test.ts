import type { ContextMap } from "@domainbook/core";
import { describe, expect, it } from "vitest";
import { partsOf, withoutTitle } from "../src/body.js";
import { debtBadge, decisionBadge, termBadge } from "../src/view/badge.js";
import { drawMap } from "../src/view/draw.js";
import { labelOf, mermaidSource } from "../src/view/map.js";
import { worstFirst } from "../src/view/order.js";

const classification = {
  domain: "core-domain",
  "business-model": "revenue-generator",
  evolution: "custom-built",
} as const;

function mapOf(edges: ContextMap["edges"], ids: string[]): ContextMap {
  return {
    contexts: ids.map((id) => ({ id, name: id, classification })),
    edges,
  };
}

const at = (id: string): string => `/domains/${id}/`;

describe("the badge a status earns", () => {
  it("says less than deprecated does, because the status cannot tell the two apart", () => {
    const badge = decisionBadge("deprecated");
    expect(badge.text).toBe("not current");
    expect(badge.title).toBe(
      "not current — read this record to see whether the choice was reversed or the record was retired"
    );
    expect(badge.current).toBe(false);
  });

  it("marks a superseded record without dropping it", () => {
    const badge = decisionBadge("superseded by ticketing/ADR-0009");
    expect(badge.text).toBe("superseded");
    expect(badge.title).toContain("ticketing/ADR-0009");
  });

  it("reads every other status as itself", () => {
    expect(decisionBadge("accepted").text).toBe("accepted");
    expect(decisionBadge("proposed").text).toBe("proposed");
    expect(decisionBadge("rejected").text).toBe("rejected");
    expect(debtBadge("repaid").text).toBe("repaid");
    expect(debtBadge("open").current).toBe(true);
    expect(termBadge("deprecated").current).toBe(false);
  });
});

describe("the order the debt register reads in", () => {
  it("puts what is still owed before what is settled", () => {
    const ordered = worstFirst([
      { status: "repaid", severity: "critical", number: 1 },
      { status: "accepted", severity: "low", number: 2 },
      { status: "open", severity: "low", number: 3 },
    ]);
    expect(ordered.map((one) => one.status)).toEqual([
      "open",
      "accepted",
      "repaid",
    ]);
  });

  it("reads worst first within what is owed", () => {
    const ordered = worstFirst(
      ["low", "critical", "medium", "high"].map((severity, index) => ({
        status: "open",
        severity,
        number: index,
      }))
    );
    expect(ordered.map((one) => one.severity)).toEqual([
      "critical",
      "high",
      "medium",
      "low",
    ]);
  });

  it("keeps log order when severity ties", () => {
    const ordered = worstFirst([
      { status: "open", severity: "high", domain: "ticketing", number: 5 },
      { status: "open", severity: "high", domain: "ticketing", number: 2 },
    ]);
    expect(ordered.map((one) => one.number)).toEqual([2, 5]);
  });
});

describe("the map drawn from what the contexts declared", () => {
  const apart = mapOf(
    [
      {
        between: ["billing", "reporting"],
        type: "separate-ways",
        patterns: [],
      },
    ],
    ["billing", "reporting"]
  );
  const supplied = mapOf(
    [
      {
        between: ["billing", "ordering"],
        type: "customer-supplier",
        upstream: "ordering",
        downstream: "billing",
        patterns: [{ by: "billing", names: ["ACL"] }],
      },
    ],
    ["billing", "ordering"]
  );

  it("draws separate-ways dashed, labelled, and without an arrowhead", () => {
    const svg = drawMap(apart, at);
    const line = /<polyline[^>]*edge-apart[^>]*\/>/.exec(svg)?.[0];
    expect(line).toBeDefined();
    expect(line).not.toContain("marker-end");
    expect(svg).toContain(">separate-ways<");
  });

  it("draws a directed relationship with an arrowhead", () => {
    const svg = drawMap(supplied, at);
    const line = /<polyline[^>]*\/>/.exec(svg)?.[0];
    expect(line).toContain("marker-end");
    expect(line).not.toContain("edge-apart");
  });

  it("carries every classification axis and opens the context's page", () => {
    const svg = drawMap(supplied, at);
    expect(svg).toContain('href="/domains/billing/"');
    expect(svg).toContain(">core-domain<");
    expect(svg).toContain(">revenue-generator · custom-built<");
  });

  it("describes itself for a reader who cannot see it", () => {
    expect(drawMap(supplied, at)).toContain(
      "ordering upstream of billing: customer-supplier"
    );
  });

  it("puts a context nobody names on the map with no edges", () => {
    const svg = drawMap(mapOf([], ["reporting"]), at);
    expect(svg).toContain(">reporting<");
    expect(svg).not.toContain("<polyline");
  });
});

describe("the map stays readable whatever the book declares", () => {
  const layered = mapOf(
    [
      {
        between: ["seating", "ticketing"],
        type: "upstream-downstream",
        upstream: "seating",
        downstream: "ticketing",
        patterns: [],
      },
      {
        between: ["ticketing", "access-control"],
        type: "upstream-downstream",
        upstream: "ticketing",
        downstream: "access-control",
        patterns: [],
      },
      {
        between: ["access-control", "seating"],
        type: "separate-ways",
        patterns: [],
      },
    ],
    ["seating", "ticketing", "access-control"]
  );

  const converging = mapOf(
    [
      {
        between: ["format", "core"],
        type: "customer-supplier",
        upstream: "format",
        downstream: "core",
        patterns: [],
      },
      {
        between: ["core", "enforcement"],
        type: "customer-supplier",
        upstream: "core",
        downstream: "enforcement",
        patterns: [],
      },
      {
        between: ["format", "enforcement"],
        type: "partnership",
        upstream: "format",
        downstream: "enforcement",
        patterns: [],
      },
    ],
    ["format", "core", "enforcement"]
  );

  it("routes an edge around what sits between its two ends", () => {
    expect(crossings(drawMap(layered, at))).toEqual([]);
  });

  it("routes every edge of a converging map around every node too", () => {
    expect(crossings(drawMap(converging, at))).toEqual([]);
  });

  it("brings two edges into the same context at different points", () => {
    const arriving = polylines(drawMap(converging, at)).map(
      (points) => points[points.length - 1]
    );
    expect(new Set(arriving.map((one) => one?.join(","))).size).toBe(
      arriving.length
    );
  });

  it("draws every label, and no two of them at the same place", () => {
    const spots = [
      ...drawMap(converging, at).matchAll(
        /<text x="(-?\d+)" y="(-?\d+)" class="edge-label"/g
      ),
    ].map((one) => `${one[1]},${one[2]}`);
    expect(spots).toHaveLength(3);
    expect(new Set(spots).size).toBe(3);
  });
});

function polylines(svg: string): number[][][] {
  return [...svg.matchAll(/<polyline points="([^"]+)"/g)].map((one) =>
    (one[1] ?? "")
      .split(" ")
      .map((pair) => pair.split(",").map((part) => Number(part)))
  );
}

function boxes(svg: string): number[][] {
  return [...svg.matchAll(/<rect x="(-?\d+)" y="(-?\d+)"/g)].map((one) => [
    Number(one[1]),
    Number(one[2]),
  ]);
}

function crossings(svg: string): string[] {
  const found: string[] = [];
  for (const points of polylines(svg))
    for (const [index, from] of points.slice(0, -1).entries())
      for (const box of boxes(svg))
        if (through(from, points[index + 1] ?? from, box))
          found.push(`${from.join(",")} crosses the box at ${box.join(",")}`);
  return found;
}

function through(from: number[], to: number[], box: number[]): boolean {
  const inset = 4;
  const [left = 0, top = 0] = box;
  const within = (one: number, other: number, low: number, high: number) =>
    Math.min(one, other) < high - inset && Math.max(one, other) > low + inset;
  return (
    within(from[0] ?? 0, to[0] ?? 0, left, left + 188) &&
    within(from[1] ?? 0, to[1] ?? 0, top, top + 76)
  );
}

describe("the mermaid the map is derived from", () => {
  it("writes separate-ways as a dotted link", () => {
    const source = mermaidSource(
      mapOf(
        [
          {
            between: ["billing", "reporting"],
            type: "separate-ways",
            patterns: [],
          },
        ],
        ["billing", "reporting"]
      ),
      at
    );
    expect(source).toContain('n0 -.-|"separate-ways"| n1');
    expect(source).toContain('click n0 "/domains/billing/"');
  });

  it("points a directed link from upstream to downstream", () => {
    const source = mermaidSource(
      mapOf(
        [
          {
            between: ["billing", "ordering"],
            type: "customer-supplier",
            upstream: "ordering",
            downstream: "billing",
            patterns: [],
          },
        ],
        ["billing", "ordering"]
      ),
      at
    );
    expect(source).toContain('n1 -->|"customer-supplier"| n0');
  });

  it("names the patterns on the side that declared them", () => {
    expect(
      labelOf({
        between: ["billing", "ordering"],
        type: "customer-supplier",
        upstream: "ordering",
        downstream: "billing",
        patterns: [{ by: "billing", names: ["ACL"] }],
      })
    ).toBe("customer-supplier · ACL by billing");
  });
});

describe("reading an artifact's body apart from its frontmatter", () => {
  it("splits a body into its H2 sections", () => {
    const parts = partsOf(
      "## Purpose\n\nHold seats.\n\n## Assumptions\n\nNone.\n"
    );
    expect(parts.map((one) => one.heading)).toEqual(["Purpose", "Assumptions"]);
    expect(parts[0]?.markdown).toBe("Hold seats.");
  });

  it("leaves an H2 inside a fenced block alone", () => {
    const parts = partsOf("## Purpose\n\n```md\n## Not a section\n```\n");
    expect(parts.map((one) => one.heading)).toEqual(["Purpose"]);
    expect(parts[0]?.markdown).toContain("## Not a section");
  });

  it("drops the title a record repeats as its H1", () => {
    expect(withoutTitle("# Expire holds\n\n## Context\n")).toBe("## Context\n");
  });

  it("leaves a body with no H1 as it is", () => {
    expect(withoutTitle("## Context\n")).toBe("## Context\n");
  });
});
