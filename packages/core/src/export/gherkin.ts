import type { Book, FeatureRecord } from "../model.js";
import type { Export, ExportFile } from "./types.js";

export function toGherkin(book: Book): Export {
  const files: ExportFile[] = [];
  const empty: string[] = [];
  for (const domain of book.domains)
    for (const record of domain.features) {
      if (record.rules.every((rule) => rule.examples.length === 0)) {
        empty.push(record.frontmatter.id);
        continue;
      }
      files.push({
        path: `${record.domain}/${record.frontmatter.id}.feature`,
        content: rendered(record),
      });
    }
  const notices =
    empty.length > 0
      ? [`wrote nothing for ${empty.join(", ")} — no fenced example`]
      : [];
  return { files, notices };
}

function rendered(record: FeatureRecord): string {
  const lines = [`Feature: ${record.frontmatter.name}`];
  for (const line of record.story.split("\n"))
    lines.push(line === "" ? "" : `  ${line}`);
  for (const rule of record.rules) {
    lines.push("", `  Rule: ${rule.name}`);
    for (const example of rule.examples)
      lines.push("", indented(example.source));
  }
  return `${lines.join("\n")}\n`;
}

function indented(text: string): string {
  return text
    .split("\n")
    .map((line) => (line === "" ? "" : `    ${line}`))
    .join("\n");
}
