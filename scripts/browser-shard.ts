#!/usr/bin/env -S deno run -A
/**
 * Runs one shard of the browser-driven tests (`deno task test:browser`).
 *
 * Usage:
 *   deno run -A scripts/browser-shard.ts <index>/<count>
 *
 * The test files are every `*.browser.test.ts` under `test/`: the name is the
 * one list, so a new browser test joins a shard without being listed here.
 * CI runs `1/4` to `4/4` as four parallel steps (.woodpecker.yml);
 * the task runs `1/1`, every file in one process. A shard with no files fails
 * instead of running `deno test` without arguments, which would run the whole
 * unit suite.
 */

import { join } from "@std/path"

/** Where the browser tests live, and the suffix that makes a file one. */
const TEST_DIR = "test"
const SUFFIX = ".browser.test.ts"

/**
 * Seconds each slow file took in CI (pipeline 1979). A file not listed counts
 * as {@link DEFAULT_SECONDS}. The weights only balance the shards; a stale one
 * fails the run, so a renamed file cannot leave a dead entry behind.
 */
export const SECONDS: Record<string, number> = {
  "test/a11y.browser.test.ts": 124,
  "test/work/connectful.browser.test.ts": 42,
  "test/csp.browser.test.ts": 38,
  "test/visual-system.browser.test.ts": 34,
  "test/meet-embed.browser.test.ts": 28,
  "test/frame.browser.test.ts": 22,
  "test/tools/preact-components.browser.test.ts": 21,
  "test/blog-overflow.browser.test.ts": 17,
  "test/tool-frame.browser.test.ts": 16,
  "test/contrast.browser.test.ts": 15,
  "test/lead-form.browser.test.ts": 12,
}
const DEFAULT_SECONDS = 7

/** Every browser test file under `dir`, as sorted paths relative to `root`. */
export async function browserTestFiles(
  root = ".",
  dir = TEST_DIR,
): Promise<string[]> {
  const files: string[] = []
  for await (const entry of Deno.readDir(join(root, dir))) {
    const path = join(dir, entry.name)
    if (entry.isDirectory) files.push(...await browserTestFiles(root, path))
    else if (entry.name.endsWith(SUFFIX)) files.push(path)
  }
  return files.sort()
}

/**
 * Splits `files` into `count` shards of about equal total seconds: the
 * slowest file goes first, each into the shard with the least time so far.
 * Every file lands in exactly one shard. Throws on a weight that names no
 * file, and on a shard left empty.
 */
export function shards(
  files: string[],
  count: number,
  seconds: Record<string, number> = SECONDS,
): string[][] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`shard count must be a positive integer, got ${count}`)
  }
  const stale = Object.keys(seconds).filter((f) => !files.includes(f))
  if (stale.length) {
    throw new Error(
      `SECONDS names files that do not exist: ${stale.join(", ")}`,
    )
  }
  const cost = (f: string) => seconds[f] ?? DEFAULT_SECONDS
  const out = Array.from(
    { length: count },
    () => ({ total: 0, files: [] as string[] }),
  )
  for (
    const f of [...files].sort((a, b) =>
      cost(b) - cost(a) || a.localeCompare(b)
    )
  ) {
    const least = out.reduce((min, s) => s.total < min.total ? s : min)
    least.total += cost(f)
    least.files.push(f)
  }
  if (out.some((s) => !s.files.length)) {
    throw new Error(`${files.length} files cannot fill ${count} shards`)
  }
  return out.map((s) => s.files.sort())
}

/** Parses `<index>/<count>`, 1-based, e.g. `2/3`. */
export function parseShard(
  arg: string | undefined,
): { index: number; count: number } {
  const m = arg?.match(/^(\d+)\/(\d+)$/)
  const index = Number(m?.[1])
  const count = Number(m?.[2])
  if (!m || index < 1 || index > count) {
    throw new Error(
      `usage: browser-shard.ts <index>/<count>, e.g. 2/3; got "${arg}"`,
    )
  }
  return { index, count }
}

if (import.meta.main) {
  const { index, count } = parseShard(Deno.args[0])
  const files = shards(await browserTestFiles(), count)[index - 1]
  console.log(`browser shard ${index}/${count}: ${files.length} files`)
  const { code } = await new Deno.Command(Deno.execPath(), {
    args: ["test", "-A", ...files],
  }).spawn().status
  Deno.exit(code)
}
