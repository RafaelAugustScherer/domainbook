const owed = ["open", "accepted", "repaid"];

const worst = ["critical", "high", "medium", "low"];

export type Owing = {
  status: string;
  severity: string;
  domain?: string;
  number: number;
};

export function worstFirst<T extends Owing>(records: T[]): T[] {
  return [...records].sort(
    (one, other) =>
      rank(owed, one.status) - rank(owed, other.status) ||
      rank(worst, one.severity) - rank(worst, other.severity) ||
      order(one.domain ?? "", other.domain ?? "") ||
      one.number - other.number
  );
}

function rank(scale: string[], value: string): number {
  const found = scale.indexOf(value);
  return found === -1 ? scale.length : found;
}

function order(one: string, other: string): number {
  if (one < other) return -1;
  return one > other ? 1 : 0;
}
