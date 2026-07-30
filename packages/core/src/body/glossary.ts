import { type Issue, schemaIssues } from "../issue.js";
import { type GlossaryRecord, termSlug, type TermRecord } from "../model.js";
import { glossaryTermSchema } from "../schemas/glossary.js";
import {
  headings,
  type Node,
  prose,
  type Section,
  sections,
  type Text,
} from "./markdown.js";

type Bullet = { label: string; value: string; line: number };

const bullet = /^\*\*(Aliases|Status|Example):\*\*(.*)/;

const layout =
  "a glossary is an optional H1 title and intro, then one H2 per term";

export function parseGlossary(
  file: string,
  nodes: Node[]
): { record: GlossaryRecord; issues: Issue[] } {
  const issues: Issue[] = [];
  for (const [index, heading] of headings(nodes).entries())
    if (heading.depth !== 2 && !(heading.depth === 1 && index === 0))
      issues.push({
        file,
        line: heading.line,
        message: `"${heading.text}" is not a term — ${layout}`,
      });

  const found = sections(nodes, 2);
  if (found.length === 0)
    issues.push({
      file,
      message: `this glossary defines no terms — ${layout}`,
    });

  const terms: TermRecord[] = [];
  for (const section of found) {
    const parsed = parseTerm(file, section);
    issues.push(...parsed.issues);
    const clash = terms.find((term) => term.slug === parsed.term.slug);
    if (clash === undefined) {
      terms.push(parsed.term);
      continue;
    }
    issues.push({
      file,
      line: section.heading.line,
      message:
        clash.slug === ""
          ? `"${clash.name}" and "${section.heading.text}" both give an empty term slug — a term is linked by its name in letters and digits, and neither name has any`
          : `"${clash.name}" and "${section.heading.text}" are both the term "${clash.slug}" — a glossary defines each term once`,
    });
  }
  return { record: { file, terms }, issues };
}

function parseTerm(
  file: string,
  section: Section
): { term: TermRecord; issues: Issue[] } {
  const name = section.heading.text;
  const texts = section.nodes.filter((node) => node.kind === "text");
  const start = texts.findIndex((node) => node.text.startsWith("- "));
  const list = bulletList(texts, start);
  const issues: Issue[] = [
    ...section.nodes
      .filter((node) => node.kind === "fence")
      .map((node) => ({
        file,
        line: node.line,
        message: `the term "${name}" holds a code block — a term is prose and bullets only`,
      })),
    ...trailing(file, name, list.after),
  ];

  const labelled: Bullet[] = [];
  for (const item of list.bullets) {
    const match = bullet.exec(item.value);
    if (match === null) {
      issues.push({
        file,
        line: item.line,
        message: `the term "${name}" has a bullet that is not "**Aliases:**", "**Status:**", or "**Example:**" — move it into the definition prose`,
      });
      continue;
    }
    labelled.push({
      label: match[1] ?? "",
      value: (match[2] ?? "").trim(),
      line: item.line,
    });
  }

  const aliasBullets = labelled.filter((one) => one.label === "Aliases");
  const statusBullets = labelled.filter((one) => one.label === "Status");
  const exampleBullets = labelled.filter((one) => one.label === "Example");
  if (aliasBullets.length > 1)
    issues.push({
      file,
      line: aliasBullets[1]?.line,
      message: `the term "${name}" repeats "**Aliases:**" — a term carries it once, with the aliases comma-separated on that one bullet`,
    });
  if (statusBullets.length > 1)
    issues.push({
      file,
      line: statusBullets[1]?.line,
      message: `the term "${name}" repeats "**Status:**" — a term carries it once`,
    });

  const aliases = aliasBullets.flatMap((one) =>
    one.value.split(",").map((alias) => alias.trim())
  );
  const examples = exampleBullets.map((one) => one.value);
  const raw = {
    name,
    definition: prose(start === -1 ? texts : texts.slice(0, start)),
    aliases: aliases.length > 0 ? aliases : undefined,
    examples: examples.length > 0 ? examples : undefined,
    status: statusBullets[0]?.value,
  };
  const at: Record<string, number | undefined> = {
    aliases: aliasBullets[0]?.line,
    status: statusBullets[0]?.line,
  };
  const schema = schemaIssues(
    file,
    glossaryTermSchema.safeParse(raw).error,
    raw,
    "term",
    (path) =>
      path[0] === "examples"
        ? exampleBullets[Number(path[1])]?.line
        : at[String(path[0])] ?? section.heading.line
  );
  if (raw.definition === "") {
    issues.push({
      file,
      line: section.heading.line,
      message: `the term "${name}" has no definition — write one as prose under its heading`,
    });
    issues.push(...schema.filter((issue) => issue.field !== "definition"));
  } else issues.push(...schema);

  return {
    term: {
      ...raw,
      status: knownStatus(raw.status),
      slug: termSlug(name),
      line: section.heading.line,
    },
    issues,
  };
}

function bulletList(
  texts: Text[],
  start: number
): { bullets: Bullet[]; after: Text[] } {
  if (start === -1) return { bullets: [], after: [] };
  const bullets: Bullet[] = [];
  let blank = false;
  for (const [index, node] of texts.slice(start).entries()) {
    const text = node.text.trim();
    if (text === "") {
      blank = true;
      continue;
    }
    if (node.text.startsWith("- ")) {
      bullets.push({ label: "", value: text.slice(2).trim(), line: node.line });
      blank = false;
      continue;
    }
    if (blank) return { bullets, after: texts.slice(start + index) };
    const last = bullets.at(-1);
    if (last !== undefined) last.value = `${last.value} ${text}`;
  }
  return { bullets, after: [] };
}

function trailing(file: string, name: string, after: Text[]): Issue[] {
  const second = after.find((node) => node.text.startsWith("- "));
  if (second !== undefined)
    return [
      {
        file,
        line: second.line,
        message: `the term "${name}" has a second bullet list — a term carries at most one, holding "**Aliases:**", "**Status:**", and "**Example:**"`,
      },
    ];
  const paragraph = after.find((node) => node.text.trim() !== "");
  if (paragraph === undefined) return [];
  return [
    {
      file,
      line: paragraph.line,
      message: `the term "${name}" has prose after its bullet list — a term is a definition and then one bullet list, with nothing after it`,
    },
  ];
}

function knownStatus(status: string | undefined): TermRecord["status"] {
  if (status === "validated" || status === "deprecated") return status;
  return "draft";
}
