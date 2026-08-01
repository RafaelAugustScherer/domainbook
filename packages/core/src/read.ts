import { prose, sections } from "./body/markdown.js";
import { readArtifact } from "./load/artifact.js";

export type Section = { heading: string; line: number; text: string };

export function sectionsOf(file: string): Section[] {
  const artifact = readArtifact(file, file);
  if (!artifact.readable) return [];
  return sections(artifact.nodes, 2).map((section) => ({
    heading: section.heading.text,
    line: section.heading.line,
    text: prose(section.nodes),
  }));
}

export function sectionNamed(file: string, heading: string): string {
  return sectionsOf(file).find((one) => one.heading === heading)?.text ?? "";
}

export function opening(text: string): string {
  const stop = /[.!?](\s|$)/.exec(text);
  if (stop === null) return text;
  return text.slice(0, stop.index + 1);
}
