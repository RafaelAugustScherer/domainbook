import { stringify } from "yaml";
import type { Book, GlossaryRecord } from "../model.js";
import { counted, type Export, type ExportFile } from "./types.js";

export function toContextive(book: Book): Export {
  const files: ExportFile[] = [];
  let dropped = 0;
  if (book.glossary !== undefined) {
    const built = context("shared", undefined, book.glossary);
    files.push({ path: "shared.glossary.yml", content: built.content });
    dropped += built.deprecated;
  }
  for (const domain of book.domains)
    if (domain.glossary !== undefined && domain.frontmatter !== undefined) {
      const built = context(
        domain.frontmatter.name,
        domain.frontmatter.code,
        domain.glossary
      );
      files.push({ path: `${domain.id}.glossary.yml`, content: built.content });
      dropped += built.deprecated;
    }
  const notices =
    dropped > 0 ? [`left out ${counted(dropped, "deprecated term")}`] : [];
  return { files, notices };
}

function context(
  name: string,
  paths: string[] | undefined,
  glossary: GlossaryRecord
): { content: string; deprecated: number } {
  const live = glossary.terms.filter((term) => term.status !== "deprecated");
  const one = {
    name,
    ...(paths !== undefined && paths.length > 0 ? { paths } : {}),
    terms: live.map((term) => ({
      name: term.name,
      definition: term.definition,
      ...(term.aliases === undefined ? {} : { aliases: term.aliases }),
      ...(term.examples === undefined ? {} : { examples: term.examples }),
    })),
  };
  return {
    content: stringify({ contexts: [one] }),
    deprecated: glossary.terms.length - live.length,
  };
}
