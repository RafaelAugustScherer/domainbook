import * as z from "zod";
import { decisionRefSource, people, unicodeFlagNote } from "./common.js";

const statusMessage =
  'must be "proposed", "rejected", "accepted", "deprecated", or "superseded by ADR-NNNN" ("<domain-id>/ADR-NNNN" for a domain log)';

export const decisionStatusSchema = z.union(
  [
    z.enum(["proposed", "rejected", "accepted", "deprecated"], {
      error: statusMessage,
    }),
    z
      .string()
      .regex(new RegExp(`^superseded by ${decisionRefSource}$`, "u"), {
        error: statusMessage,
      })
      .meta({
        description: `"superseded by ADR-NNNN", or "superseded by <domain-id>/ADR-NNNN" for a domain's own log. ${unicodeFlagNote}`,
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
