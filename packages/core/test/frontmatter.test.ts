import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../src/index.js";

describe("parseFrontmatter", () => {
  it("splits the fenced block from the body", () => {
    const { data, body } = parseFrontmatter(
      "---\nid: ticketing\n---\n\n## Purpose\n\nSell seats.\n"
    );
    expect(data).toEqual({ id: "ticketing" });
    expect(body).toBe("\n## Purpose\n\nSell seats.\n");
  });

  it("reports no data for a file without a fenced block", () => {
    const source = "# Glossary\n\n## Hold\n";
    expect(parseFrontmatter(source)).toEqual({ data: undefined, body: source });
  });

  it("leaves a horizontal rule in the body alone", () => {
    const source = "# Glossary\n\n---\n\n## Hold\n";
    expect(parseFrontmatter(source).body).toBe(source);
  });

  it("stops at the first closing fence", () => {
    const { data, body } = parseFrontmatter(
      "---\nid: a\n---\nbody\n\n---\n\nmore\n"
    );
    expect(data).toEqual({ id: "a" });
    expect(body).toBe("body\n\n---\n\nmore\n");
  });

  it("keeps yaml dates as strings", () => {
    expect(parseFrontmatter("---\ndate: 2026-04-18\n---\n").data).toEqual({
      date: "2026-04-18",
    });
  });

  it("reads an empty block as frontmatter with no keys", () => {
    expect(parseFrontmatter("---\n---\n# Title\n")).toEqual({
      data: {},
      body: "# Title\n",
    });
    expect(parseFrontmatter("---\n\n---\n# Title\n")).toEqual({
      data: {},
      body: "# Title\n",
    });
  });

  it("reads a file that opens with a byte order mark", () => {
    const { data, body } = parseFrontmatter(
      "\uFEFF---\nid: ticketing\n---\n# Title\n"
    );
    expect(data).toEqual({ id: "ticketing" });
    expect(body).toBe("# Title\n");
  });

  it("drops a byte order mark from a file with no frontmatter", () => {
    expect(parseFrontmatter("\uFEFF# Glossary\n")).toEqual({
      data: undefined,
      body: "# Glossary\n",
    });
  });

  it("handles crlf line endings", () => {
    const { data, body } = parseFrontmatter(
      "---\r\nid: a\r\n---\r\n# Title\r\n"
    );
    expect(data).toEqual({ id: "a" });
    expect(body).toBe("# Title\r\n");
  });
});
