export type Answer = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

export function said(...lines: (string | undefined)[]): Answer {
  return { content: [{ type: "text", text: joined(lines) }] };
}

export function refuse(...lines: (string | undefined)[]): Answer {
  return { content: [{ type: "text", text: joined(lines) }], isError: true };
}

export function listed(names: string[]): string {
  const sorted = [...names].sort();
  if (sorted.length <= 1) return sorted.join("");
  return `${sorted.slice(0, -1).join(", ")} and ${sorted.at(-1)}`;
}

function joined(lines: (string | undefined)[]): string {
  return lines
    .filter((line) => line !== undefined)
    .join("\n")
    .trimEnd();
}
