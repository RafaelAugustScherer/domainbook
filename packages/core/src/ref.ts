import type { Book, DebtRecord, DecisionRecord } from "./model.js";

const pattern = /^(?:([^/]+)\/)?ADR-(\d{4})$/u;

const supersede = "superseded by ";

export function adrRef(record: DecisionRecord): string {
  return qualified(record.domain, "ADR", record.number);
}

export function tdrRef(record: DebtRecord): string {
  return qualified(record.domain, "TDR", record.number);
}

export function findDecision(
  book: Book,
  ref: string
): DecisionRecord | undefined {
  const parsed = pattern.exec(ref);
  if (parsed === null) return undefined;
  const [, domain, digits] = parsed;
  const log =
    domain === undefined
      ? book.decisions
      : book.domains.find((one) => one.id === domain)?.decisions ?? [];
  return log.find((record) => record.number === Number(digits));
}

export function supersededBy(record: DecisionRecord): string | undefined {
  const { status } = record.frontmatter;
  if (!status.startsWith(supersede)) return undefined;
  return status.slice(supersede.length);
}

export function live(record: DecisionRecord): boolean {
  return (
    record.frontmatter.status !== "rejected" &&
    supersededBy(record) === undefined
  );
}

function qualified(
  domain: string | undefined,
  kind: string,
  number: number
): string {
  const ref = `${kind}-${String(number).padStart(4, "0")}`;
  return domain === undefined ? ref : `${domain}/${ref}`;
}
