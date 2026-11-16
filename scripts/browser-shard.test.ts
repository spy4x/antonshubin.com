import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0"
import {
  browserTestFiles,
  parseShard,
  SECONDS,
  shards,
} from "./browser-shard.ts"

/** The `<index>/<count>` of every browser shard step in .woodpecker/woodpecker.yml. */
async function ciShards(): Promise<{ index: number; count: number }[]> {
  const yml = await Deno.readTextFile(
    new URL("../.woodpecker/woodpecker.yml", import.meta.url),
  )
  return [...yml.matchAll(/browser-shard\.ts (\d+\/\d+)/g)].map((m) =>
    parseShard(m[1])
  )
}

Deno.test("the CI shard steps run every browser test file exactly once", async () => {
  const files = await browserTestFiles()
  assert(files.length >= 37, `found only ${files.length} browser test files`)
  const steps = await ciShards()
  const count = steps[0]?.count
  assert(count > 1, "no browser-shard step in .woodpecker/woodpecker.yml")
  assertEquals(
    steps.map((s) => `${s.index}/${s.count}`).toSorted(),
    Array.from({ length: count }, (_, i) => `${i + 1}/${count}`),
  )
  const split = shards(files, count)
  const assigned = steps.flatMap((s) => split[s.index - 1])
  assertEquals(assigned.toSorted(), files)
})

Deno.test("no CI shard carries more than half the browser test seconds", async () => {
  const files = await browserTestFiles()
  const cost = (f: string) => SECONDS[f] ?? 7
  const total = files.reduce((s, f) => s + cost(f), 0)
  for (const shard of shards(files, (await ciShards())[0].count)) {
    assert(shard.reduce((s, f) => s + cost(f), 0) <= total / 2)
  }
})

Deno.test("the slowest file gets a shard to itself when the rest fill another", () => {
  assertEquals(shards(["a", "b", "c"], 2, { a: 10, b: 3, c: 3 }), [["a"], [
    "b",
    "c",
  ]])
})

Deno.test("a weight for a file that no longer exists fails the split", () => {
  assertThrows(() => shards(["a"], 1, { gone: 5 }), Error, "gone")
})

Deno.test("more shards than files fails instead of leaving one empty", () => {
  assertThrows(() => shards(["a"], 2, {}), Error, "cannot fill 2 shards")
})

Deno.test("a shard argument is index/count with the index in range", () => {
  assertEquals(parseShard("2/3"), { index: 2, count: 3 })
  for (const bad of [undefined, "3", "0/3", "4/3", "a/b"]) {
    assertThrows(() => parseShard(bad), Error, "usage")
  }
})
