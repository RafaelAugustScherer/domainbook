import type { Issue } from "./issue.js";
import type {
  Book,
  DecisionFile,
  DecisionRecord,
  DomainRecord,
} from "./model.js";
import { termSlug } from "./model.js";
import { slug } from "./schemas/common.js";

type Declared = {
  domain: DomainRecord;
  index: number;
  with: string;
  type: string;
  direction?: string;
};

type Log = { id?: string; records: DecisionRecord[]; files: DecisionFile[] };

const reference = /^(?:([a-z0-9]+(?:-[a-z0-9]+)*)\/)?ADR-(\d{4})$/;
const superseded = "superseded by ";

export function checkBook(book: Book): Issue[] {
  return [
    ...checkRelationships(book),
    ...checkFeatures(book),
    ...checkLogs(book),
    ...checkDomainIds(book),
    ...checkMilestones(book),
  ];
}

function checkRelationships(book: Book): Issue[] {
  const issues: Issue[] = [];
  const ids = book.domains.map((domain) => domain.id).sort();
  const declared: Declared[] = [];
  for (const domain of book.domains)
    for (const [index, relationship] of (
      domain.frontmatter?.relationships ?? []
    ).entries()) {
      const at = {
        file: domain.file,
        line: domain.lines[`relationships[${index}].with`],
        field: `relationships[${index}].with`,
      };
      if (relationship.with === domain.id) {
        issues.push({
          ...at,
          message: `"${domain.id}" is this domain — a relationship names another domain`,
        });
        continue;
      }
      if (!ids.includes(relationship.with)) {
        issues.push({
          ...at,
          message: `no domain "${
            relationship.with
          }" in this book — domains are ${ids.join(", ")}`,
        });
        continue;
      }
      declared.push({
        domain,
        index,
        with: relationship.with,
        type: relationship.type,
        direction:
          "direction" in relationship ? relationship.direction : undefined,
      });
    }

  const pairs = new Map<string, Declared[]>();
  for (const one of declared) {
    const key = [one.domain.id, one.with].sort().join(" ");
    pairs.set(key, [...(pairs.get(key) ?? []), one]);
  }
  for (const group of pairs.values()) {
    const seen: Declared[] = [];
    for (const one of group) {
      if (seen.some((other) => other.domain.file === one.domain.file)) {
        issues.push({
          ...at(one, "with"),
          message: `"${one.with}" is declared twice on this page — a relationship is declared once`,
        });
        continue;
      }
      for (const other of seen) issues.push(...contradiction(book, other, one));
      seen.push(one);
    }
  }
  return issues;
}

function at(one: Declared, key: string) {
  return {
    file: one.domain.file,
    line: one.domain.lines[`relationships[${one.index}].${key}`],
    field: `relationships[${one.index}].${key}`,
  };
}

function contradiction(book: Book, held: Declared, mirror: Declared): Issue[] {
  if (mirror.type !== held.type)
    return [
      {
        ...at(held, "type"),
        message: `"${held.type}" contradicts "${
          mirror.type
        }" declared in ${inBook(
          book,
          mirror.domain.file
        )} — mirrored declarations of the same relationship must agree`,
      },
    ];
  if (held.direction !== undefined && held.direction === mirror.direction)
    return [
      {
        ...at(held, "direction"),
        message: `both sides are "${held.direction}" — ${inBook(
          book,
          mirror.domain.file
        )} declares the mirror, so one of the two is "${opposite(
          held.direction
        )}"`,
      },
    ];
  return [];
}

function checkFeatures(book: Book): Issue[] {
  const issues: Issue[] = [];
  for (const domain of book.domains)
    for (const feature of domain.features) {
      const glossaries = [domain.glossary, book.glossary].filter(
        (glossary) => glossary !== undefined
      );
      for (const [index, term] of (feature.frontmatter.terms ?? []).entries()) {
        if (
          glossaries.some((glossary) =>
            glossary.terms.some((one) => one.slug === term)
          )
        )
          continue;
        const field = `terms[${index}]`;
        issues.push({
          file: feature.file,
          line: feature.lines[field],
          field,
          message:
            glossaries.length === 0
              ? `no term "${term}" — neither ${domain.id} nor this book has a glossary.md`
              : `no term "${term}" in ${glossaries
                  .map((glossary) => inBook(book, glossary.file))
                  .join(" or ")}`,
        });
      }
      for (const [index, ref] of (
        feature.frontmatter.decisions ?? []
      ).entries()) {
        const missing = findDecision(book, ref);
        const field = `decisions[${index}]`;
        if (missing !== undefined)
          issues.push({
            file: feature.file,
            line: feature.lines[field],
            field,
            message: `no decision "${ref}" — ${missing}`,
          });
      }
      const name = basename(feature.file).replace(/\.md$/, "");
      if (feature.frontmatter.id !== name)
        issues.push({
          file: feature.file,
          line: feature.lines["id"],
          field: "id",
          message: `"${
            feature.frontmatter.id
          }" does not match the filename "${name}" — rename the file to "${
            feature.frontmatter.id
          }.md"${orSetId(name)}`,
        });
    }
  return issues;
}

function checkLogs(book: Book): Issue[] {
  const logs: Log[] = [
    { records: book.decisions, files: book.decisionFiles },
    ...book.domains.map((domain) => ({
      id: domain.id,
      records: domain.decisions,
      files: domain.decisionFiles,
    })),
  ];
  return logs.flatMap((log) => [
    ...checkNumbers(book, log),
    ...checkTitles(log),
    ...checkSupersedes(book, log),
  ]);
}

function checkNumbers(book: Book, log: Log): Issue[] {
  const issues: Issue[] = [];
  const seen = new Map<number, DecisionFile>();
  let free = highest(log.files) + 1;
  for (const one of log.files) {
    if (one.number < 1) {
      issues.push({
        file: one.file,
        message: `ADR-${pad(
          one.number
        )} is below 0001 — decision numbers run from 0001, so renumber this one to ${pad(
          free
        )}`,
      });
      free += 1;
      continue;
    }
    const twin = seen.get(one.number);
    if (twin === undefined) {
      seen.set(one.number, one);
      continue;
    }
    issues.push({
      file: one.file,
      message: `ADR-${pad(one.number)} is already ${inBook(
        book,
        twin.file
      )} — decision numbers are never reused; renumber this one to ${pad(
        free
      )}`,
    });
    free += 1;
  }
  const ordered = [...seen.values()].sort(
    (one, other) => one.number - other.number
  );
  let expected = 1;
  for (const one of ordered) {
    for (; expected < one.number; expected += 1)
      issues.push({
        file: one.file,
        message: `ADR-${pad(expected)} is missing from ${logDir(
          log.id
        )} — decision numbers run from 0001 with no gaps, and an ADR is never deleted`,
      });
    expected = one.number + 1;
  }
  return issues;
}

function checkTitles(log: Log): Issue[] {
  const issues: Issue[] = [];
  for (const decision of log.records) {
    if (decision.title === "") continue;
    const slugged = termSlug(decision.title);
    if (slugged === "") {
      issues.push({
        file: decision.file,
        message: `the title "${
          decision.title
        }" gives no filename — a decision filename is its number and its title in lowercase letters and digits, so rename to "${pad(
          decision.number
        )}-your-title-here.md"`,
      });
      continue;
    }
    const wanted = `${pad(decision.number)}-${slugged}.md`;
    if (basename(decision.file) !== wanted)
      issues.push({
        file: decision.file,
        message: `the filename does not match the title "${decision.title}" — rename to "${wanted}"`,
      });
  }
  return issues;
}

function checkSupersedes(book: Book, log: Log): Issue[] {
  const issues: Issue[] = [];
  for (const decision of log.records) {
    const { status } = decision.frontmatter;
    if (!status.startsWith(superseded)) continue;
    const ref = status.slice(superseded.length);
    const at = {
      file: decision.file,
      line: decision.lines["status"],
      field: "status",
    };
    if (log.id !== undefined && !ref.includes("/")) {
      issues.push({
        ...at,
        message: `bare "${ref}" in a domain's own log means the book-level ${logDir(
          undefined
        )}, not ${logDir(log.id)} — write "${
          log.id
        }/${ref}" if you meant this domain's log`,
      });
      continue;
    }
    const missing = findDecision(book, ref);
    if (missing !== undefined)
      issues.push({
        ...at,
        message: `"${status}" names no decision — ${missing}`,
      });
  }
  return issues;
}

function checkDomainIds(book: Book): Issue[] {
  return book.domains.flatMap((domain) => {
    const id = domain.frontmatter?.id;
    if (id === undefined || id === domain.id) return [];
    return [
      {
        file: domain.file,
        line: domain.lines["id"],
        field: "id",
        message: `"${id}" does not match the folder "${
          domain.id
        }" — rename the folder to "${id}"${orSetId(domain.id)}`,
      },
    ];
  });
}

function orSetId(name: string): string {
  return slug.safeParse(name).success ? ` or set id to "${name}"` : "";
}

function checkMilestones(book: Book): Issue[] {
  const roadmap = book.roadmap;
  if (roadmap === undefined) return [];
  const issues: Issue[] = [];
  const seen = new Map<string, number>();
  for (const [index, milestone] of roadmap.frontmatter.milestones.entries()) {
    const first = seen.get(milestone.id);
    if (first === undefined) {
      seen.set(milestone.id, index);
      continue;
    }
    const field = `milestones[${index}].id`;
    issues.push({
      file: roadmap.file,
      line: roadmap.lines[field],
      field,
      message: `"${milestone.id}" is already milestones[${first}].id — milestone ids are unique`,
    });
  }
  return issues;
}

function findDecision(book: Book, ref: string): string | undefined {
  const match = reference.exec(ref);
  if (match === null)
    return `write "ADR-NNNN", or "<domain-id>/ADR-NNNN" for a domain's own log`;
  const id = match[1];
  const domain =
    id === undefined ? undefined : book.domains.find((one) => one.id === id);
  if (id !== undefined && domain === undefined)
    return `there is no domain "${id}" in this book`;
  const files =
    domain === undefined ? book.decisionFiles : domain.decisionFiles;
  if (files.some((one) => one.number === Number(match[2]))) return undefined;
  const dir = logDir(id);
  if (files.length === 0) return `${dir} is empty`;
  return `${dir} holds ${listed(files.map((one) => `ADR-${pad(one.number)}`))}`;
}

function logDir(id: string | undefined): string {
  return id === undefined ? "decisions/" : `domains/${id}/decisions/`;
}

function inBook(book: Book, file: string): string {
  return file.startsWith(`${book.root}/`)
    ? file.slice(book.root.length + 1)
    : file;
}

function listed(names: string[]): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function highest(files: DecisionFile[]): number {
  return Math.max(0, ...files.map((one) => one.number));
}

function opposite(direction: string): string {
  return direction === "upstream" ? "downstream" : "upstream";
}

function basename(file: string): string {
  return file.slice(file.lastIndexOf("/") + 1);
}

function pad(number: number): string {
  return String(number).padStart(4, "0");
}
