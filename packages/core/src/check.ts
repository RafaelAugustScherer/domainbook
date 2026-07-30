import type { Issue } from "./issue.js";
import type {
  Book,
  DecisionFile,
  DecisionRecord,
  DomainRecord,
  FeatureRecord,
} from "./model.js";
import { termSlug } from "./model.js";
import { slug, slugSource } from "./schemas/common.js";
import { divergence, overlong, slugBytes } from "./unicode.js";

type Declared = {
  domain: DomainRecord;
  index: number;
  with: string;
  type: string;
  direction?: string;
};

type Log = { id?: string; records: DecisionRecord[]; files: DecisionFile[] };

type At = { file: string; line?: number; field?: string };

const reference = new RegExp(`^(?:(${slugSource})/)?ADR-(\\d{4})$`, "u");
const superseded = "superseded by ";

export function checkBook(book: Book): Issue[] {
  return [
    ...checkRelationships(book),
    ...checkFeatures(book),
    ...checkTerms(book),
    ...checkLogs(book),
    ...checkDomainIds(book),
    ...checkMilestones(book),
  ];
}

function notNfc(at: At, value: string): Issue | undefined {
  const wrong = divergence(value, "NFC");
  if (wrong === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" is not in Unicode NFC — at character ${
      wrong.index + 1
    } it holds ${wrong.held} where NFC holds ${
      wrong.wanted
    }; write the NFC form, or this and the same text written elsewhere will not match`,
  };
}

function notNfkc(at: At, value: string): Issue | undefined {
  const wrong = divergence(value, "NFKC");
  if (wrong === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" folds to "${
      wrong.normalized
    }" under NFKC — character ${wrong.index + 1} is ${
      wrong.held
    }, a compatibility form; write the folded form, or this and the slug it looks like are two different names`,
  };
}

function tooLong(at: At, value: string): Issue | undefined {
  const bytes = overlong(value);
  if (bytes === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" is ${bytes} bytes as UTF-8 — a slug holds at most ${slugBytes}, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it`,
  };
}

function checkRelationships(book: Book): Issue[] {
  const issues: Issue[] = [];
  const declared: Declared[] = [];
  for (const domain of book.domains)
    for (const [index, relationship] of (
      domain.frontmatter?.relationships ?? []
    ).entries()) {
      const wrong = badPartner(book, domain, index, relationship.with);
      if (wrong !== undefined) {
        issues.push(wrong);
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
  return [...issues, ...mirrorIssues(book, declared)];
}

function badPartner(
  book: Book,
  domain: DomainRecord,
  index: number,
  partner: string
): Issue | undefined {
  const at = {
    file: domain.file,
    line: domain.lines[`relationships[${index}].with`],
    field: `relationships[${index}].with`,
  };
  const unnormalized = notNfc(at, partner) ?? notNfkc(at, partner);
  if (unnormalized !== undefined) return unnormalized;
  if (partner === domain.id)
    return {
      ...at,
      message: `"${domain.id}" is this domain — a relationship names another domain`,
    };
  const ids = book.domains.map((one) => one.id).sort();
  if (!ids.includes(partner))
    return {
      ...at,
      message: `no domain "${partner}" in this book — domains are ${ids.join(
        ", "
      )}`,
    };
  return undefined;
}

function mirrorIssues(book: Book, declared: Declared[]): Issue[] {
  const issues: Issue[] = [];
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
    for (const feature of domain.features)
      issues.push(
        ...checkFeatureTerms(book, domain, feature),
        ...checkFeatureDecisions(book, feature),
        ...checkFeatureId(feature)
      );
  return issues;
}

function checkFeatureTerms(
  book: Book,
  domain: DomainRecord,
  feature: FeatureRecord
): Issue[] {
  const issues: Issue[] = [];
  const glossaries = [domain.glossary, book.glossary].filter(
    (glossary) => glossary !== undefined
  );
  for (const [index, term] of (feature.frontmatter.terms ?? []).entries()) {
    const field = `terms[${index}]`;
    const at = { file: feature.file, line: feature.lines[field], field };
    const unnormalized = notNfc(at, term) ?? notNfkc(at, term);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
    if (
      glossaries.some((glossary) =>
        glossary.terms.some((one) => one.slug === term)
      )
    )
      continue;
    issues.push({ ...at, message: noTerm(book, domain, glossaries, term) });
  }
  return issues;
}

function noTerm(
  book: Book,
  domain: DomainRecord,
  glossaries: { file: string }[],
  term: string
): string {
  if (glossaries.length === 0)
    return `no term "${term}" — neither ${domain.id} nor this book has a glossary.md`;
  const files = glossaries
    .map((glossary) => inBook(book, glossary.file))
    .join(" or ");
  return `no term "${term}" in ${files}`;
}

function checkFeatureDecisions(book: Book, feature: FeatureRecord): Issue[] {
  const issues: Issue[] = [];
  for (const [index, ref] of (feature.frontmatter.decisions ?? []).entries()) {
    const field = `decisions[${index}]`;
    const at = { file: feature.file, line: feature.lines[field], field };
    const unnormalized = notNfc(at, ref) ?? notNfkc(at, ref);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
    const missing = findDecision(book, ref);
    if (missing !== undefined)
      issues.push({ ...at, message: `no decision "${ref}" — ${missing}` });
  }
  return issues;
}

function checkFeatureId(feature: FeatureRecord): Issue[] {
  const filename = basename(feature.file);
  const onDisk = { file: feature.file };
  const unnamed = notNfc(onDisk, filename) ?? notNfkc(onDisk, filename);
  const at = { file: feature.file, line: feature.lines["id"], field: "id" };
  const id = feature.frontmatter.id;
  const wrong = notNfc(at, id) ?? notNfkc(at, id) ?? tooLong(at, id);
  const issues = [unnamed, wrong].filter((issue) => issue !== undefined);
  const name = filename.replace(/\.md$/, "");
  if (issues.length > 0 || id === name) return issues;
  return [
    {
      ...at,
      message: `"${id}" does not match the filename "${name}" — rename the file to "${id}.md"${orSetId(
        name
      )}`,
    },
  ];
}

function checkTerms(book: Book): Issue[] {
  const issues: Issue[] = [];
  const glossaries = [
    book.glossary,
    ...book.domains.map((domain) => domain.glossary),
  ];
  for (const glossary of glossaries) {
    if (glossary === undefined) continue;
    for (const term of glossary.terms) {
      const at = { file: glossary.file, line: term.line };
      const wrong =
        notNfc(at, term.name) ??
        notNfkc(at, term.slug) ??
        tooLong(at, term.slug);
      if (wrong !== undefined) issues.push(wrong);
    }
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
    const at = { file: decision.file };
    const filename = basename(decision.file);
    if (decision.title === "") {
      const unnamed = notNfc(at, filename) ?? notNfkc(at, filename);
      if (unnamed !== undefined) issues.push(unnamed);
      continue;
    }
    const slugged = termSlug(decision.title);
    if (slugged === "") {
      issues.push({
        ...at,
        message: `the title "${
          decision.title
        }" gives no filename — a decision filename is its number and its title in letters and digits, so rename to "${pad(
          decision.number
        )}-your-title-here.md"`,
      });
      continue;
    }
    const unwritable =
      notNfkc(at, slugged) ??
      tooLong(at, slugged) ??
      notNfc(at, filename) ??
      notNfkc(at, filename);
    if (unwritable !== undefined) {
      issues.push(unwritable);
      continue;
    }
    const wanted = `${pad(decision.number)}-${slugged}.md`;
    if (filename !== wanted)
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
    const unnormalized = notNfc(at, ref) ?? notNfkc(at, ref);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
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
    const folder = domain.file.slice(0, domain.file.lastIndexOf("/"));
    const onDisk = { file: folder };
    const unnamed = notNfc(onDisk, domain.id) ?? notNfkc(onDisk, domain.id);
    const id = domain.frontmatter?.id;
    if (id === undefined) return unnamed === undefined ? [] : [unnamed];
    const at = { file: domain.file, line: domain.lines["id"], field: "id" };
    const wrong = notNfc(at, id) ?? notNfkc(at, id) ?? tooLong(at, id);
    const issues = [unnamed, wrong].filter((issue) => issue !== undefined);
    if (issues.length > 0 || id === domain.id) return issues;
    return [
      {
        ...at,
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
  const head = { file: roadmap.file, line: roadmap.lines["id"], field: "id" };
  const id = roadmap.frontmatter.id;
  const named = notNfc(head, id) ?? notNfkc(head, id) ?? tooLong(head, id);
  if (named !== undefined) issues.push(named);
  const seen = new Map<string, number>();
  for (const [index, milestone] of roadmap.frontmatter.milestones.entries()) {
    const field = `milestones[${index}].id`;
    const at = { file: roadmap.file, line: roadmap.lines[field], field };
    const wrong =
      notNfc(at, milestone.id) ??
      notNfkc(at, milestone.id) ??
      tooLong(at, milestone.id);
    if (wrong !== undefined) {
      issues.push(wrong);
      continue;
    }
    const first = seen.get(milestone.id);
    if (first === undefined) {
      seen.set(milestone.id, index);
      continue;
    }
    issues.push({
      ...at,
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
  const names = files.map((one) => `ADR-${pad(one.number)}`);
  return `${dir} holds ${listed(names)}`;
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
