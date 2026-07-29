import * as z from "zod";
import { decisionRefSource, people } from "./common.js";

const statusMessage =
  'must be "proposed", "rejected", "accepted", "deprecated", or "superseded by ADR-NNNN" ("<domain-id>/ADR-NNNN" for a domain log)';

export const decisionStatusSchema = z.union(
  [
    z.enum(["proposed", "rejected", "accepted", "deprecated"], {
      error: statusMessage,
    }),
    z.string().regex(new RegExp(`^superseded by ${decisionRefSource}$`), {
      error: statusMessage,
    }),
  ],
  { error: statusMessage }
);

export const decisionSchema = z
  .strictObject({
    status: decisionStatusSchema,
    date: z.iso.date({ error: "must be a date as YYYY-MM-DD" }),
    "decision-makers": people.optional(),
    consulted: people.optional(),
    informed: people.optional(),
  })
  .meta({ title: "domainbook decision frontmatter" });

export type DecisionStatus = z.infer<typeof decisionStatusSchema>;
export type Decision = z.infer<typeof decisionSchema>;
