import * as z from "zod";
import { slug } from "./common.js";

export const milestoneSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  status: z.enum(["planned", "in-progress", "done"]),
});

export const roadmapSchema = z
  .strictObject({
    id: slug,
    milestones: z.array(milestoneSchema).min(1),
  })
  .meta({ title: "domainbook roadmap frontmatter" });

export type Milestone = z.infer<typeof milestoneSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
