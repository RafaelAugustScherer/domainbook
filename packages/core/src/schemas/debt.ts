import * as z from "zod";
import { code, decisionRef, people } from "./common.js";

export const debtSchema = z
  .strictObject({
    status: z.enum(["open", "accepted", "repaid"]),
    date: z.iso.date({ error: "must be a date as YYYY-MM-DD" }),
    severity: z.enum(["low", "medium", "high", "critical"]),
    quadrant: z.enum([
      "deliberate-prudent",
      "deliberate-reckless",
      "inadvertent-prudent",
      "inadvertent-reckless",
    ]),
    owners: people.optional(),
    code: code.optional(),
    decisions: z.array(decisionRef).min(1).optional(),
  })
  .meta({ title: "domainbook debt frontmatter" });

export type Debt = z.infer<typeof debtSchema>;
