import * as z from "zod";

const word = String.raw`[\p{Ll}\p{Lo}\p{Lm}\p{Nd}][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]*`;

export const unicodeFlagNote =
  'The pattern uses Unicode property escapes and must be compiled with the ECMA-262 "u" flag.';

export const slugSource = String.raw`${word}(?:-${word})*`;

export const slug = z
  .string()
  .regex(new RegExp(`^${slugSource}$`, "u"), {
    error:
      "must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals",
  })
  .meta({
    description: `Words joined by single hyphens, each starting with a letter or digit in any script, with no capitals. ${unicodeFlagNote}`,
  });

export const decisionRefSource = String.raw`(?:${slugSource}\/)?ADR-\d{4}`;

export const decisionRef = z
  .string()
  .regex(new RegExp(`^${decisionRefSource}$`, "u"), {
    error: 'must be "ADR-NNNN" or "<domain-id>/ADR-NNNN"',
  })
  .meta({
    description: `"ADR-NNNN", or "<domain-id>/ADR-NNNN" for a domain's own log. ${unicodeFlagNote}`,
  });

export const people = z.array(z.string().min(1)).min(1);
