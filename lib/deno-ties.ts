/**
 * The "How tied to Deno is your project?" checklist of the post on moving
 * Seed off Deno (#597). Each item is a row of the post's own table, word for
 * word: what a project may use, and what replaced it in Seed. The reader ticks
 * what their project uses; the result lists the ticked rows. It starts with
 * Seed's own case ticked. No score, no estimate, no duration.
 */

/** One row of the post's table, and one checkbox. */
export interface DenoTie {
  /** A stable id for the checkbox. */
  id: string
  /** The table's first column; backticks mark code. */
  label: string
  /** The table's second column: what replaced it in Seed. */
  inSeed: string
  /** Whether Seed used it: the checklist starts with these ticked. */
  seedUsed: boolean
}

const tie = (
  id: string,
  seedUsed: boolean,
  label: string,
  inSeed: string,
): DenoTie => ({ id, seedUsed, label, inSeed })

/** The post's table, in its order. */
export const DENO_TIES: readonly DenoTie[] = [
  tie(
    "serve",
    true,
    "`Deno.serve` or `deno serve`",
    "The servers export a standard `fetch` handler. Deno still runs it with `deno serve`; on Node and Bun a start file hands it to `serve()` from `@spy4x/platform`.",
  ),
  tie(
    "env",
    true,
    "`Deno.env`",
    "`processEnv` from `@spy4x/platform`: `Deno.env` on Deno, `process.env` on Node and Bun.",
  ),
  tie(
    "files",
    true,
    "File APIs: `Deno.readFile`, `Deno.stat`, `Deno.open`",
    "A small file interface with two versions: `Deno.*` on Deno, `node:fs/promises` on Node and Bun.",
  ),
  tie(
    "errors",
    true,
    "Deno's error classes, such as `Deno.errors.NotFound`",
    'One `fsError` and `isFsError` pair that also knows Node\'s `code: "EISDIR"`.',
  ),
  tie(
    "types",
    true,
    "`Deno.Signal` or other `Deno` types in exported signatures",
    "`OsSignal`, a list of the same 36 names, with a type test in both directions.",
  ),
  tie(
    "defaults",
    true,
    "Default arguments that call `Deno.*`",
    "Defaults that pick the running runtime's version.",
  ),
  tie(
    "tcp",
    true,
    "`Deno.connect`, such as a Redis client",
    "Nothing: the client already ran over a `connectTcp` adapter, `Deno.connect` on Deno and `node:net` on Node and Bun.",
  ),
  tie(
    "fresh",
    true,
    "Fresh",
    "`@spy4x/preact-server`, a new layer that copies Fresh 2's API.",
  ),
  tie(
    "jsr",
    true,
    "`jsr:` imports",
    "`deno bundle` builds them into the server file, so Node and Bun never see a `jsr:` import.",
  ),
  tie(
    "command",
    true,
    "`Deno.Command`",
    "Nothing: only the screenshot, video and changelog scripts use it, and they stay on Deno.",
  ),
  tie(
    "toolchain",
    true,
    "`deno test`, `deno fmt`, `deno lint`",
    "Nothing: the toolchain stays Deno. `npm run` and `bun run` call the same `deno task`s.",
  ),
  tie(
    "kv",
    false,
    "Deno KV",
    "Never used: the data lives in Postgres and Valkey.",
  ),
  tie(
    "deploy",
    false,
    "Deno Deploy",
    "Never used: Seed runs in Docker Compose on any Linux host.",
  ),
  tie(
    "compile",
    false,
    "`deno compile`",
    "Never used: Seed ships Docker images.",
  ),
]

/** The ids Seed used: the checklist's starting ticks. */
export const SEED_TIES: ReadonlySet<string> = new Set(
  DENO_TIES.filter((t) => t.seedUsed).map((t) => t.id),
)

/** What the result shows for a set of ticks. */
export interface DenoTiesResult {
  /** The ticked rows, in table order. */
  rows: DenoTie[]
  /** One sentence counting the ticks against Seed's. */
  summary: string
}

/** The ticked rows and the sentence above them. */
export function denoTiesResult(ticked: ReadonlySet<string>): DenoTiesResult {
  const rows = DENO_TIES.filter((t) => ticked.has(t.id))
  const shared = rows.filter((t) => t.seedUsed).length
  const summary = rows.length === 0
    ? "Nothing ticked: your project has none of these ties."
    : `You ticked ${rows.length} of ${DENO_TIES.length}. Seed had ${shared} of those, and here is what replaced each one.`
  return { rows, summary }
}

/** The checklist's Dev.to fallback: the table above is the checklist. */
export function denoTiesMarkdown(): string {
  return "The table above also works as a checklist you can tick for your own project."
}
