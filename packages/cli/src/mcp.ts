import { readFileSync } from "node:fs";

export type Server = { type: string; command: string; args: string[] };

export type Planned = {
  text: string;
  server: Server;
  held: Server | undefined;
  existed: boolean;
};

export const mcpFile = ".mcp.json";

export const badJson = `${mcpFile} is not valid JSON, so it cannot be added to — fix it, or move it aside and run this again`;

export function planServer(at: string): Planned | { refusal: string } {
  const server = wanted(at);
  const source = readOr(mcpFile);
  if (source === undefined)
    return {
      text: rendered({ mcpServers: { domainbook: server } }),
      server,
      held: undefined,
      existed: false,
    };
  let held: Record<string, unknown>;
  try {
    held = JSON.parse(source) as Record<string, unknown>;
  } catch {
    return { refusal: badJson };
  }
  if (held === null || typeof held !== "object" || Array.isArray(held))
    return { refusal: badJson };
  const servers = { ...(held["mcpServers"] as Record<string, unknown>) };
  const before = servers["domainbook"];
  return {
    text: rendered({ ...held, mcpServers: { ...servers, domainbook: server } }),
    server,
    held: isServer(before) ? before : undefined,
    existed: true,
  };
}

export function rootOf(server: Server): string {
  const last = server.args.at(-1);
  return last === undefined || last === "mcp" ? "domainbook" : last;
}

export function same(one: Server, other: Server | undefined): boolean {
  if (other === undefined) return false;
  return (
    one.command === other.command && one.args.join(" ") === other.args.join(" ")
  );
}

export function snippets(at: string): string[] {
  const server = wanted(at);
  const { command, args } = server;
  return [
    "these four are yours to paste — domainbook does not edit a settings file it did not write:",
    "",
    ".cursor/mcp.json",
    block({ mcpServers: { domainbook: server } }),
    "",
    ".vscode/mcp.json",
    block({ servers: { domainbook: server } }),
    "",
    ".codex/config.toml",
    "[mcp_servers.domainbook]",
    `command = ${JSON.stringify(command)}`,
    `args = [${args.map((one) => JSON.stringify(one)).join(", ")}]`,
    "",
    ".gemini/settings.json",
    block({ mcpServers: { domainbook: { command, args } } }),
    "",
    `every one of them runs ${[command, ...args].join(" ")}`,
  ];
}

function block(value: unknown): string {
  return JSON.stringify(value, undefined, 2);
}

function wanted(at: string): Server {
  const args = ["-y", "domainbook", "serve", "mcp"];
  return {
    type: "stdio",
    command: "npx",
    args: at === "domainbook" ? args : [...args, at],
  };
}

function isServer(value: unknown): value is Server {
  if (value === null || typeof value !== "object") return false;
  const held = value as Record<string, unknown>;
  return typeof held["command"] === "string" && Array.isArray(held["args"]);
}

function rendered(value: unknown): string {
  return `${JSON.stringify(value, undefined, 2)}\n`;
}

function readOr(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}
