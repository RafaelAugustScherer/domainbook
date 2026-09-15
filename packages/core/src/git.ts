import { execFileSync } from "node:child_process";

export type Ran = { code: number; out: string; err: string };

const quiet = {
  GIT_TERMINAL_PROMPT: "0",
  GIT_SSH_COMMAND: `${process.env.GIT_SSH_COMMAND ?? "ssh"} -o BatchMode=yes -o ConnectTimeout=15`,
};

export function git(cwd: string, args: string[], env?: NodeJS.ProcessEnv): Ran {
  try {
    const out = execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: env === undefined ? process.env : { ...process.env, ...env },
      timeout: 60_000,
    });
    return { code: 0, out, err: "" };
  } catch (thrown) {
    const failed = thrown as {
      status?: number | null;
      stdout?: string;
      stderr?: string;
      code?: string;
    };
    if (failed.code === "ENOENT")
      return { code: 127, out: "", err: "git is not installed" };
    return {
      code: failed.status ?? 1,
      out: failed.stdout ?? "",
      err: failed.stderr ?? "",
    };
  }
}

export function online(cwd: string, args: string[]): Ran {
  return git(cwd, args, quiet);
}

export function lines(out: string): string[] {
  return out.split("\n").filter((line) => line !== "");
}

export function records(out: string): string[][] {
  return out
    .split("\u0001")
    .filter((one) => one.trim() !== "")
    .map((one) => one.split("\u0000").map((field) => field.trim()));
}
