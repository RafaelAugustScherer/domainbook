import type { ZodError } from "zod";

export type Issue = {
  file: string;
  line?: number;
  field?: string;
  message: string;
};

type ZodIssue = ZodError["issues"][number];

const written: Record<string, string> = {
  string: "must be text — put the value in quotes",
  array: 'must be a list — write each value as a "- " bullet below it',
  object: "must be a block of keys indented below it",
  boolean: "must be true or false",
  number: "must be a number",
};

export function formatIssue(issue: Issue): string {
  const at = issue.line === undefined ? "" : `:${issue.line}`;
  const field = issue.field === undefined ? "" : ` ${issue.field}`;
  return `${issue.file}${at}${field}: ${issue.message}`;
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(
    (one, other) =>
      order(one.file, other.file) ||
      (one.line ?? 0) - (other.line ?? 0) ||
      order(one.field ?? "", other.field ?? "")
  );
}

export function dotted(path: PropertyKey[]): string {
  let text = "";
  for (const key of path) {
    if (typeof key === "number") text += `[${key}]`;
    else text = text === "" ? String(key) : `${text}.${String(key)}`;
  }
  return text;
}

export function schemaIssues(
  file: string,
  error: ZodError | undefined,
  data: unknown,
  label: string,
  locate: (path: PropertyKey[]) => number | undefined
): Issue[] {
  if (error === undefined) return [];
  return error.issues.flatMap((issue): Issue[] => {
    if (issue.code === "unrecognized_keys") {
      const holder =
        issue.path.length === 0 ? `a ${label}` : `"${dotted(issue.path)}"`;
      return issue.keys.map((key) => ({
        file,
        line: locate([...issue.path, key]),
        field: dotted([...issue.path, key]),
        message: `is not a field of ${holder} — check the spelling, or remove it`,
      }));
    }
    const field = dotted(issue.path);
    return [
      {
        file,
        line: locate(issue.path),
        field: field === "" ? undefined : field,
        message: messageOf(issue, valueAt(data, issue.path)),
      },
    ];
  });
}

function messageOf(issue: ZodIssue, value: unknown): string {
  if (issue.code === "invalid_type")
    return value === undefined
      ? "is required"
      : written[issue.expected] ?? issue.message;
  if (issue.code === "too_small")
    return issue.origin === "array"
      ? "lists nothing — name at least one, or remove the key"
      : "is empty — write a value, or remove it";
  if (
    issue.code === "invalid_value" &&
    issue.message.startsWith("Invalid option:")
  )
    return `must be one of ${issue.values
      .map((option) => `"${String(option)}"`)
      .join(", ")}`;
  return issue.message;
}

function valueAt(data: unknown, path: PropertyKey[]): unknown {
  let value = data;
  for (const key of path) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<PropertyKey, unknown>)[key];
  }
  return value;
}

function order(one: string, other: string): number {
  if (one < other) return -1;
  return one > other ? 1 : 0;
}
