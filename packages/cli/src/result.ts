export type Serving = { root: string; mcp: boolean; web: boolean };

export type Result = {
  code: number;
  lines: string[];
  serve?: Serving;
  build?: string;
};

export function refuse(message: string): Result {
  return { code: 1, lines: [message] };
}
