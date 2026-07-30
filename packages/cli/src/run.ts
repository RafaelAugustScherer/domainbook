import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { bookRoot } from "./files.js";
import { init } from "./init.js";
import { newDecision, newDomain, newFeature } from "./new.js";
import { refuse, type Result } from "./result.js";
import { validate } from "./validate.js";

type Values = {
  help?: boolean;
  version?: boolean;
  domain?: string;
  supersedes?: string;
};
type Command = {
  name: string;
  usage: string;
  options: readonly ("domain" | "supersedes")[];
};

const options = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  domain: { type: "string" },
  supersedes: { type: "string" },
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
} as const satisfies Record<string, Command>;

const help = [
  "domainbook — living documentation for a codebase, enforced from the repo",
  "",
  "usage:",
  `  ${commands.validate.usage}`,
  `  ${commands.init.usage}`,
  `  ${commands.domain.usage}`,
  `  ${commands.feature.usage}`,
  `  ${commands.decision.usage}`,
  "",
  "commands:",
  "  validate   read the book and print every issue, one per line",
  "  init       write a new book: roadmap.md and domainbook.config.yaml",
  "  new        add a domain page, a feature, or a decision",
  "",
  "options:",
  "  --domain <domain-id>    the domain a feature or a decision belongs to",
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
      'domainbook needs a command — validate, init, or new; run "domainbook --help" to see them'
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
  if (command !== "new")
    return refuse(
      `"${command}" is not a domainbook command — the commands are validate, init, and new; run "domainbook --help" to see them`
    );
  return runNew(values, positionals);
}

function runNew(values: Values, positionals: string[]): Result {
  const [, second, third, fourth] = positionals;
  if (second === undefined)
    return refuse(
      '"domainbook new" needs what to write — a domain, a feature, or a decision'
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
  return refuse(
    `"${second}" is not a domainbook artifact — "domainbook new" writes a domain, a feature, or a decision`
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
  const stray = (["domain", "supersedes"] as const).find(
    (name) => values[name] !== undefined && !command.options.includes(name)
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
  const named = /--?[a-zA-Z][\w-]*/.exec(message)?.[0];
  if (named === undefined)
    return `${message} — run "domainbook --help" to see every command and option`;
  if ((thrown as { code?: string }).code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    const command = asked(argv);
    if (command === undefined)
      return `"${named}" is not a domainbook option — the options are --domain, --supersedes, --help, and --version; run "domainbook --help" to see which command takes which`;
    return `"${named}" is not a domainbook option — "${
      command.name
    }" takes ${takes(command.options)}; usage: ${command.usage}`;
  }
  if (named === "--help" || named === "-h")
    return '"--help" takes no value — write "--help" on its own';
  if (named === "--version" || named === "-v")
    return '"--version" takes no value — write "--version" on its own';
  const value = argv[argv.lastIndexOf(named) + 1];
  if (value === undefined)
    return `"${named}" was given no value — write "${named} <value>"`;
  return `"${named} ${value}" reads as two options — write "${named}=${value}" to pass a value that starts with a dash`;
}

function asked(argv: string[]): Command | undefined {
  const [first, second] = argv.filter((one) => !one.startsWith("-"));
  if (first === "validate" || first === "init") return commands[first];
  if (first !== "new") return undefined;
  if (second === "domain" || second === "feature" || second === "decision")
    return commands[second];
  return undefined;
}

function takes(allowed: readonly string[]): string {
  const all = [...allowed.map((one) => `--${one}`), "--help"];
  if (all.length === 1) return "only --help";
  if (all.length === 2) return all.join(" and ");
  return `${all.slice(0, -1).join(", ")}, and --help`;
}
