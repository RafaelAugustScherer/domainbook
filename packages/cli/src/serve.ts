import {
  formatIssue,
  missingBook,
  sortIssues,
  validateBook,
} from "@domainbook/core";
import { refuse, type Result } from "./result.js";

const regardless =
  'the site cannot be built from a book with issues — "domainbook serve mcp" serves it over MCP regardless';

export function serve(target: string | undefined, root: string): Result {
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  if (target === "mcp")
    return { code: 0, lines: [], serve: { root, mcp: true, web: false } };
  const issues = broken(root);
  if (issues !== undefined) return { code: 1, lines: [...issues, regardless] };
  return {
    code: 0,
    lines: [],
    serve: { root, mcp: target !== "web", web: true },
  };
}

export function build(root: string): Result {
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const issues = broken(root);
  if (issues !== undefined) return { code: 1, lines: issues };
  return { code: 0, lines: [], build: root };
}

function broken(root: string): string[] | undefined {
  const { issues } = validateBook(root);
  if (issues.length === 0) return undefined;
  return sortIssues(issues).map(formatIssue);
}
