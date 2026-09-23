// Static guard for issue #172, round 2: a rendered-page test only catches a
// regression on a page it actually fetches, and only when the current data
// happens to contain something worth escaping — which it doesn't today. This
// instead reads the source directly and checks, per file, that every
// `application/ld+json` mention has a matching `__html:` block whose value
// is a `toJsonLd(...)` call — not a bare `JSON.stringify(...)`, not a
// variable, not some other shape this scan doesn't recognise. A mismatch
// between the two counts, or a captured token that isn't `toJsonLd(`, fails
// the test rather than silently checking fewer blocks than actually exist
// (see test/rendered.test.ts and test/projects-claims.test.ts for why a
// page-based gap is real: /pay needed a hand-written entry there because
// it's noindex and not in the sitemap loop).
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

async function allTsxFiles(): Promise<string[]> {
  const root = new URL("..", import.meta.url).pathname;
  return (await Promise.all(
    ["routes", "components", "islands"].map((dir) => tsxFiles(`${root}${dir}`)),
  )).flat();
}

/** Every mention of the ld+json media type, in any attribute shape
 * (`type="application/ld+json"`, `type={"application/ld+json"}`, ...). This
 * is the count a file's `__html:` blocks are checked against, so a shape
 * the block regex below doesn't recognise still shows up as a mismatch
 * instead of just not being counted by either side. */
const LD_JSON_MENTION = /application\/ld\+json/g;

/**
 * From a ld+json script tag (the strict `type="application/ld+json"` shape
 * this repo actually uses) through to whatever token follows the block's
 * `__html:` — across whitespace and newlines — up to and including a `(` if
 * the token is immediately called. `toJsonLd(...)` captures `"toJsonLd("`;
 * a bare variable like `extraLd` captures `"extraLd"` (no trailing paren,
 * since none follows), which fails the `toJsonLd(` check below instead of
 * being mistaken for a call.
 */
const LD_JSON_HTML_TOKEN =
  /type=["']application\/ld\+json["'][\s\S]*?__html:\s*([A-Za-z0-9_.]+\(?)/g;

Deno.test("every ld+json block under routes/, components/, islands/ uses toJsonLd", async () => {
  const files = await allTsxFiles();
  assert(files.length > 10, "found too few .tsx files — the walk is broken");

  let totalBlocks = 0;
  for (const file of files) {
    const source = await Deno.readTextFile(file);
    const mentionCount = [...source.matchAll(LD_JSON_MENTION)].length;
    const tokens = [...source.matchAll(LD_JSON_HTML_TOKEN)].map((m) => m[1]);

    assertEquals(
      tokens.length,
      mentionCount,
      `${file}: ${mentionCount} mention(s) of application/ld+json but only ${tokens.length} matched the expected type="application/ld+json" ... __html: <token> shape — an unrecognised attribute or __html shape must not be silently skipped`,
    );

    for (const token of tokens) {
      assert(
        token.startsWith("toJsonLd("),
        `${file}: ld+json block's __html is "${token}", not a toJsonLd(...) call`,
      );
    }
    totalBlocks += tokens.length;
  }
  assertEquals(totalBlocks, 5, "expected exactly 5 ld+json blocks (#172)");
});

Deno.test("no JSON.stringify sits inside a dangerouslySetInnerHTML block", async () => {
  const files = await allTsxFiles();

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
