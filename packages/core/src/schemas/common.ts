import * as z from "zod";

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  error: "must be lowercase words joined by single hyphens",
});

export const decisionRefSource = String.raw`(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)?ADR-\d{4}`;

export const decisionRef = z
  .string()
  .regex(new RegExp(`^${decisionRefSource}$`), {
    error: 'must be "ADR-NNNN" or "<domain-id>/ADR-NNNN"',
  });

export const people = z.array(z.string().min(1)).min(1);
