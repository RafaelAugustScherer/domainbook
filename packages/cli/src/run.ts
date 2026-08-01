import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { check, type Source } from "./check.js";
import { bookRoot } from "./files.js";
import { hooksInstall, hooksUninstall } from "./hooks.js";
import { init } from "./init.js";
import { instructions } from "./instructions.js";
import { newDebt, newDecision, newDomain, newFeature } from "./new.js";
import { refuse, type Result } from "./result.js";
import { validate } from "./validate.js";

type Named =
  | "domain"
  | "supersedes"
  | "staged"
  | "message-file"
  | "range"
  | "session"
  | "check";

type Values = {
  help?: boolean;
  version?: boolean;
  domain?: string;
  supersedes?: string;
  staged?: boolean;
  "message-file"?: string;
  range?: string;
  session?: string;
  check?: boolean;
};

type Command = {
  name: string;
  usage: string;
  options: readonly Named[];
};

const named: readonly Named[] = [
  "domain",
  "supersedes",
  "staged",
  "message-file",
  "range",
  "session",
  "check",
];

const options = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  domain: { type: "string" },
  supersedes: { type: "string" },
  staged: { type: "boolean" },
  "message-file": { type: "string" },
  range: { type: "string" },
  session: { type: "string" },
  check: { type: "boolean" },
} as const;

const commands = {
  validate: {
    name: "domainbook validate",
    usage: "domainbook validate [root]",
    options: [],
  },
  init: {
    name: "domainbook init",
    usage: "domainbook init [root]",
    options: [],
  },
  check: {
    name: "domainbook check",
    usage:
      "domainbook check (--staged [--message-file <path>] | --range <base>..<head> | --session <path>) [root]",
    options: ["staged", "message-file", "range", "session"],
  },
  install: {
    name: "domainbook hooks install",
    usage: "domainbook hooks install [root]",
    options: [],
  },
  uninstall: {
    name: "domainbook hooks uninstall",
    usage: "domainbook hooks uninstall",
    options: [],
  },
  instructions: {
    name: "domainbook instructions",
    usage: "domainbook instructions [--check] [root]",
    options: ["check"],
  },
  domain: {
    name: "domainbook new domain",
    usage: "domainbook new domain <id> [root]",
    options: [],
  },
  feature: {
    name: "domainbook new feature",
    usage: "domainbook new feature <id> [root] --domain <domain-id>",
    options: ["domain"],
  },
  decision: {
    name: "domainbook new decision",
    usage:
      'domainbook new decision "<title>" [root] [--domain <domain-id>] [--supersedes <number>]',
    options: ["domain", "supersedes"],
  },
  debt: {
    name: "domainbook new debt",
    usage: 'domainbook new debt "<title>" [root] [--domain <domain-id>]',
    options: ["domain"],
  },
} as const satisfies Record<string, Command>;

const help = [
  "domainbook — living documentation for a codebase, enforced from the repo",
  "",
  "usage:",
  `  ${commands.validate.usage}`,
  `  ${commands.init.usage}`,
  `  ${commands.check.usage}`,
  `  ${commands.install.usage}`,
  `  ${commands.uninstall.usage}`,
  `  ${commands.instructions.usage}`,
  `  ${commands.domain.usage}`,
  `  ${commands.feature.usage}`,
  `  ${commands.decision.usage}`,
  `  ${commands.debt.usage}`,
  "",
  "commands:",
  "  validate       read the book and print every issue, one per line",
  "  init           write a new book: roadmap.md and domainbook.config.yaml",
  "  check          refuse a change that leaves a domain's book behind",
  "  hooks          install or remove the commit-msg hook that runs the check",
  "  instructions   write the rule into AGENTS.md, CLAUDE.md, and .claude/rules/",
  "  new            add a domain page, a feature, a decision, or a debt record",
  "",
  "options:",
  "  --staged                what git has staged, for a commit about to happen",
  "  --message-file <path>   the commit message to read a waiver from, and to",
  "                          stamp one into",
  "  --range <base>..<head>  every commit a branch adds, judged as one change",
  "  --session <path>        a file of paths an agent session touched",
  "  --check                 say whether the generated files are current, and",
  "                          write nothing",
  "  --domain <domain-id>    the domain a feature, a decision, or a debt record",
  "                          belongs to",
  "  --supersedes <number>   the decision this new one replaces",
  "  -h, --help              print this",
  "  -v, --version           print the version of domainbook that is installed",
  "",
  'root defaults to "domainbook".',
];

export function run(argv: string[]): Result {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options,
      allowPositionals: true,
      strict: true,
    });
  } catch (thrown) {
    return refuse(misused(argv, thrown));
  }
  const values: Values = parsed.values;
  const { positionals } = parsed;
  if (values.help === true) return { code: 0, lines: help };

  const [command, second] = positionals;
  if (values.version === true) {
    if (command === undefined)
      return { code: 0, lines: [`domainbook ${installed()}`] };
    return refuse(
      '"--version" is not an option here — domainbook has one version, not one per command; write "domainbook --version" on its own'
    );
  }
  if (command === undefined)
    return refuse(
      'domainbook needs a command — validate, init, check, hooks, instructions, or new; run "domainbook --help" to see them'
    );
  if (command === "validate")
    return (
      stop(commands.validate, values, positionals, 2) ??
      validate(bookRoot(second))
    );
  if (command === "init")
    return (
      stop(commands.init, values, positionals, 2) ?? init(bookRoot(second))
    );
  if (command === "check")
    return (
      stop(commands.check, values, positionals, 2) ?? runCheck(values, second)
    );
  if (command === "instructions")
    return (
      stop(commands.instructions, values, positionals, 2) ??
      instructions(bookRoot(second), values.check === true)
    );
  if (command === "hooks") return runHooks(values, positionals);
  if (command !== "new")
    return refuse(
      `"${command}" is not a domainbook command — the commands are validate, init, check, hooks, instructions, and new; run "domainbook --help" to see them`
    );
  return runNew(values, positionals);
}

function runCheck(values: Values, root: string | undefined): Result {
  const chosen = (["staged", "range", "session"] as const).filter(
    (one) => values[one] !== undefined
  );
  if (chosen.length === 0)
    return refuse(
      `"domainbook check" needs to know what to read — usage: ${commands.check.usage}`
    );
  if (chosen.length > 1)
    return refuse(
      `"--${chosen[0]}" and "--${chosen[1]}" read different changes — pass one of them; usage: ${commands.check.usage}`
    );
  if (values["message-file"] !== undefined && values.staged !== true)
    return refuse(
      `"--message-file" is a commit message to read a waiver from, so it goes with "--staged" — usage: ${commands.check.usage}`
    );
  return check(bookRoot(root), sourceOf(values));
}

function sourceOf(values: Values): Source {
  if (values.range !== undefined) return { kind: "range", range: values.range };
  if (values.session !== undefined)
    return { kind: "session", file: values.session };
  return { kind: "staged", messageFile: values["message-file"] };
}

function runHooks(values: Values, positionals: string[]): Result {
  const [, second, third] = positionals;
  if (second === "install")
    return (
      stop(commands.install, values, positionals, 3) ??
      hooksInstall(bookRoot(third))
    );
  if (second === "uninstall")
    return stop(commands.uninstall, values, positionals, 2) ?? hooksUninstall();
  if (second === undefined)
    return refuse(
      '"domainbook hooks" needs to know which — install to put the check in front of every commit, uninstall to take it back out'
    );
  return refuse(
    `"${second}" is not something "domainbook hooks" does — it installs the commit-msg hook, or uninstalls it`
  );
}

function runNew(values: Values, positionals: string[]): Result {
  const [, second, third, fourth] = positionals;
  if (second === undefined)
    return refuse(
      '"domainbook new" needs what to write — a domain, a feature, a decision, or a debt record'
    );
  if (second === "domain") {
    if (third === undefined)
      return refuse(
        `"domainbook new domain" needs an id — usage: ${commands.domain.usage}`
      );
    return (
      stop(commands.domain, values, positionals, 4) ??
      newDomain(bookRoot(fourth), third)
    );
  }
  if (second === "feature") {
    if (third === undefined)
      return refuse(
        `"domainbook new feature" needs an id — usage: ${commands.feature.usage}`
      );
    return (
      stop(commands.feature, values, positionals, 4) ??
      newFeature(bookRoot(fourth), third, values.domain)
    );
  }
  if (second === "decision") {
    if (third === undefined)
      return refuse(
        `"domainbook new decision" needs a title — usage: ${commands.decision.usage}`
      );
    return (
      stop(commands.decision, values, positionals, 4) ??
      newDecision(bookRoot(fourth), third, values.domain, values.supersedes)
    );
  }
  if (second === "debt") {
    if (third === undefined)
      return refuse(
        `"domainbook new debt" needs a title — usage: ${commands.debt.usage}`
      );
    return (
      stop(commands.debt, values, positionals, 4) ??
      newDebt(bookRoot(fourth), third, values.domain)
    );
  }
  return refuse(
    `"${second}" is not a domainbook artifact — "domainbook new" writes a domain, a feature, a decision, or a debt record`
  );
}

function installed(): string {
  const manifest = readFileSync(
    new URL("../package.json", import.meta.url),
    "utf8"
  );
  return (JSON.parse(manifest) as { version: string }).version;
}

function stop(
  command: Command,
  values: Values,
  positionals: string[],
  keep: number
): Result | undefined {
  const stray = named.find(
    (one) => values[one] !== undefined && !command.options.includes(one)
  );
  if (stray !== undefined)
    return refuse(
      `"--${stray}" is not an option here — usage: ${command.usage}`
    );
  const spare = positionals[keep];
  if (spare !== undefined)
    return refuse(`"${spare}" does not belong here — usage: ${command.usage}`);
  return undefined;
}

function misused(argv: string[], thrown: unknown): string {
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  const found = /--?[a-zA-Z][\w-]*/.exec(message)?.[0];
  if (found === undefined)
    return `${message} — run "domainbook --help" to see every command and option`;
  if ((thrown as { code?: string }).code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    const command = asked(argv);
    if (command === undefined)
      return `"${found}" is not a domainbook option — the options are ${takes([
        ...named,
        "version",
      ])}; run "domainbook --help" to see which command takes which`;
    return `"${found}" is not a domainbook option — "${
      command.name
    }" takes ${takes(command.options)}; usage: ${command.usage}`;
  }
  if (found === "--help" || found === "-h")
    return '"--help" takes no value — write "--help" on its own';
  if (found === "--version" || found === "-v")
    return '"--version" takes no value — write "--version" on its own';
  const value = argv[argv.lastIndexOf(found) + 1];
  if (value === undefined)
    return `"${found}" was given no value — write "${found} <value>"`;
  return `"${found} ${value}" reads as two options — write "${found}=${value}" to pass a value that starts with a dash`;
}

function asked(argv: string[]): Command | undefined {
  const [first, second] = argv.filter((one) => !one.startsWith("-"));
  if (
    first === "validate" ||
    first === "init" ||
    first === "check" ||
    first === "instructions"
  )
    return commands[first];
  if (first === "hooks")
    return second === "install" || second === "uninstall"
      ? commands[second]
      : undefined;
  if (first !== "new") return undefined;
  if (
    second === "domain" ||
    second === "feature" ||
    second === "decision" ||
    second === "debt"
  )
    return commands[second];
  return undefined;
}

function takes(allowed: readonly string[]): string {
  const all = [...allowed.map((one) => `--${one}`), "--help"];
  if (all.length === 1) return "only --help";
  if (all.length === 2) return all.join(" and ");
  return `${all.slice(0, -1).join(", ")}, and --help`;
}
