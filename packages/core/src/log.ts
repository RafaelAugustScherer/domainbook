import type { ZodType } from "zod";
import { parseDebtBody } from "./body/debt.js";
import { parseDecisionBody } from "./body/decision.js";
import type { Node } from "./body/markdown.js";
import type { Issue } from "./issue.js";
import { type Debt, debtSchema } from "./schemas/debt.js";
import { type Decision, decisionSchema } from "./schemas/decision.js";

export type LogKind<T> = {
  dir: string;
  ref: string;
  one: string;
  keys: string;
  schema: ZodType<T>;
  body: (file: string, nodes: Node[]) => { title: string; issues: Issue[] };
};

export type LogNaming = Pick<LogKind<unknown>, "dir" | "ref" | "one">;

export const decisionLog: LogKind<Decision> = {
  dir: "decisions",
  ref: "ADR",
  one: "decision",
  keys: '"status" and "date"',
  schema: decisionSchema,
  body: parseDecisionBody,
};

export const debtLog: LogKind<Debt> = {
  dir: "debt",
  ref: "TDR",
  one: "debt record",
  keys: '"status", "date", "severity", and "quadrant"',
  schema: debtSchema,
  body: parseDebtBody,
};
