export type Result = { code: number; lines: string[]; serve?: string };

export function refuse(message: string): Result {
  return { code: 1, lines: [message] };
}
