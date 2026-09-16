import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { git } from "../git.js";
import type { Remote } from "./remote.js";

export type Pending = {
  key: string;
  path: string;
  title: string;
  branch: string | undefined;
};

export type State = {
  attemptedAt: number | undefined;
  syncedAt: number | undefined;
  url: string | undefined;
};

export const throttleMs = 60_000;

export function stateDir(remote: Remote): string {
  const path = git(remote.repo, ["rev-parse", "--git-path", "domainbook"]);
  return resolve(remote.repo, path.out.trim() || ".git/domainbook");
}

export function readState(remote: Remote): State {
  const read = readJson(join(stateDir(remote), "state.json"));
  const state = (read ?? {}) as Partial<State>;
  return {
    attemptedAt: state.attemptedAt,
    syncedAt: state.syncedAt,
    url: state.url,
  };
}

export function writeState(remote: Remote, state: State): void {
  writeJson(join(stateDir(remote), "state.json"), state);
}

export function readPending(remote: Remote): Pending[] {
  return (readJson(join(stateDir(remote), "pending.json")) ?? []) as Pending[];
}

export function writePending(remote: Remote, pending: Pending[]): void {
  const file = join(stateDir(remote), "pending.json");
  if (pending.length === 0) {
    rmSync(file, { force: true });
    return;
  }
  writeJson(file, pending);
}

export function addPending(remote: Remote, one: Pending): void {
  const rest = readPending(remote).filter((each) => each.key !== one.key);
  writePending(remote, [...rest, one]);
}

export function dropPending(remote: Remote, key: string): void {
  writePending(
    remote,
    readPending(remote).filter((each) => each.key !== key)
  );
}

export function tempIndex(remote: Remote, name: string): string {
  const dir = stateDir(remote);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.index`);
  rmSync(file, { force: true });
  return file;
}

function readJson(file: string): unknown {
  if (!existsSync(file)) return undefined;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
