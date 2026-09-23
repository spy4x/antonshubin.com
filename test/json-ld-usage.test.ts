// Static guard for issue #172, round 2: a rendered-page test only catches a
// regression on a page it actually fetches. This instead reads the source
// directly, so a `<script type="application/ld+json">` block anywhere under
// routes/, components/ or islands/ is caught even on a page nothing else
// exercises (see test/rendered.test.ts and test/projects-claims.test.ts for
// why that gap is real: /pay needed a hand-written entry there because it's
// noindex and not in the sitemap loop).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";

/** Every `.tsx` file under `dir`, recursively. No `@std/fs` dependency for a
 * three-line walk — see AGENTS.md's "own the small" rule. */
async function tsxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...await tsxFiles(path));
    } else if (entry.isFile && path.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files;
}

/** Matches a ld+json script tag through to the `__html:` value's leading
 * call expression, e.g. `__html: toJsonLd(` or `__html: JSON.stringify(`. */
const LD_JSON_BLOCK =
  /type=["']application\/ld\+json["'][\s\S]*?__html:\s*([A-Za-z0-9_.]+)\(/g;

Deno.test("every ld+json block under routes/, components/, islands/ uses toJsonLd", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const files = (await Promise.all(
    ["routes", "components", "islands"].map((dir) => tsxFiles(`${root}${dir}`)),
  )).flat();
  assert(files.length > 10, "found too few .tsx files — the walk is broken");

  let blocksChecked = 0;
  for (const file of files) {
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(LD_JSON_BLOCK)) {
      blocksChecked++;
      assertEquals(
        match[1],
        "toJsonLd",
        `${file}: ld+json block's __html uses ${
          match[1]
        }(...), not toJsonLd(...)`,
      );
    }
  }
  assertEquals(blocksChecked, 5, "expected exactly 5 ld+json blocks (#172)");
});

Deno.test("no JSON.stringify sits inside a dangerouslySetInnerHTML block", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const files = (await Promise.all(
    ["routes", "components", "islands"].map((dir) => tsxFiles(`${root}${dir}`)),
  )).flat();

  const pattern = /dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(/g;
  for (const file of files) {
    const source = await Deno.readTextFile(file);
    const hit = pattern.exec(source);
    pattern.lastIndex = 0;
    assert(
      !hit,
      `${file}: dangerouslySetInnerHTML feeds JSON.stringify(...) directly — use toJsonLd() from lib/json-ld.ts`,
    );
  }
});
