#!/usr/bin/env -S deno run -A
/**
 * Writes `lib/rostok-catalog.json` (#461): every stack rostok can scaffold,
 * as `rostok stack list --format json` prints it from the version pinned in
 * rostok's `lib/tools.ts` entry (`registry.version`), kept to what
 * `/tools/rostok` shows: name, description, category, and the keys of the
 * required and the secret variables.
 *
 * Run with:
 *   deno run -A scripts/rostok-catalog.ts
 *
 * then commit the changed JSON. Rerun it whenever `registry.version` changes:
 * `test/tools/rostok.test.ts` fails while the file's version differs. The
 * page renders from the committed file, never from a live call.
 */
import { tool } from "../lib/tools.ts";
import type { RostokCatalog } from "../lib/rostok-catalog.ts";

const OUT = new URL("../lib/rostok-catalog.json", import.meta.url);

/** One stack as `rostok stack list --format json` prints it. */
interface ListedStack {
  name: string;
  description: string;
  category: string;
  variables: { key: string; required: boolean; secret: boolean }[];
}

async function main() {
  const version = tool("rostok").registry?.version;
  if (!version) throw new Error("lib/tools.ts: rostok has no registry.version");
  const out = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-config",
      "-R",
      "-E",
      "--allow-net=jsr.io",
      `jsr:@rostok/cli@${version}`,
      "stack",
      "list",
      "--format",
      "json",
    ],
    stdout: "piped",
    stderr: "inherit",
  }).output();
  if (!out.success) {
    throw new Error(`rostok stack list exited with ${out.code}`);
  }
  const listed: ListedStack[] = JSON.parse(
    new TextDecoder().decode(out.stdout),
  );
  const catalog: RostokCatalog = {
    version,
    stacks: listed.map((s) => ({
      name: s.name,
      description: s.description,
      category: s.category,
      required: s.variables.filter((v) => v.required).map((v) => v.key),
      secret: s.variables.filter((v) => v.secret).map((v) => v.key),
    })),
  };
  await Deno.writeTextFile(OUT, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(
    `Wrote lib/rostok-catalog.json: ${catalog.stacks.length} stacks of ${version}`,
  );
}

if (import.meta.main) {
  await main();
}
