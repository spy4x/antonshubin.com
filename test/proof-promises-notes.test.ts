// Guards for the single-source rule #186 introduced: a proof figure, a
// promise title or a testimonial may be written only through lib/proof.ts,
// lib/promises.ts and lib/testimonials.ts, and every margin note claim must
// resolve to a real note. The source-scan guards below read every .ts/.tsx
// file under routes/, components/, islands/ and lib/ (excluding the source
// files themselves and every *.test.ts) and fail on a hand-written copy —
// same reasoning as test/no-emoji.test.ts walking rendered pages instead of
// trusting that a fix was applied everywhere.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { proofFigures } from "../lib/proof.ts";
import { promises } from "../lib/promises.ts";
import { startSite } from "./harness.ts";
import { jsonLd } from "./html.ts";
import { note } from "../lib/notes.ts";

const SCAN_DIRS = ["routes", "components", "islands", "lib"];

/** Every .ts/.tsx file under SCAN_DIRS, excluding the given file names and every *.test.ts. */
async function sourceFiles(exclude: string[]): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (entry.name.endsWith(".test.ts")) continue;
      if (exclude.some((e) => path.endsWith(e))) continue;
      found.push(path);
    }
  }
  for (const dir of SCAN_DIRS) await walk(dir);
  return found;
}

// Figures with punctuation specific enough that a plain substring match
// won't false-positive on unrelated numbers elsewhere in the codebase (a
// bare "80" or "100%" shows up in CSS/viewport values that have nothing to
// do with Upwork, so "job-success" is grepped for as the full phrase
// "100% Job Success" instead of the bare percentage). Each entry pairs a
// proof figure id with the exact rendered substring a hand-written copy
// would contain.
const FIGURE_NEEDLES: Record<string, string> = {
  "jobs": "80+",
  "job-success": "100% Job Success",
  "earned": "395K",
  "hours": "6,600",
  "expert-vetted": "Expert-Vetted",
  "top-percent": "Top 1%",
};

Deno.test("every proof figure appears in source only through lib/proof.ts", async () => {
  assertEquals(
    proofFigures.map((f) => f.id).sort(),
    Object.keys(FIGURE_NEEDLES).sort(),
    "FIGURE_NEEDLES is missing or has an extra id compared to lib/proof.ts",
  );
  const files = await sourceFiles(["lib/proof.ts"]);
  for (const [id, needle] of Object.entries(FIGURE_NEEDLES)) {
    for (const file of files) {
      const text = await Deno.readTextFile(file);
      assert(
        !text.includes(needle),
        `${file} hand-writes proof figure "${id}" ("${needle}") instead of reading lib/proof.ts`,
      );
    }
  }
});

Deno.test("every promise title appears in source only through lib/promises.ts", async () => {
  const files = await sourceFiles(["lib/promises.ts"]);
  for (const p of promises) {
    for (const file of files) {
      const text = await Deno.readTextFile(file);
      assert(
        !text.includes(p.title),
        `${file} hand-writes promise title "${p.title}" instead of reading lib/promises.ts`,
      );
    }
  }
});

Deno.test("every data-note-ref on every page in /sitemap.xml resolves to a note with a source", async () => {
  const site = await startSite();
  try {
    const xml = await site.html("/sitemap.xml");
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname
    );
    assert(
      paths.length > 0,
      "sitemap.xml is empty — the loop below would pass vacuously",
    );
    let refsSeen = 0;
    for (const path of paths) {
      const html = await site.html(path);
      const refs = [...html.matchAll(/data-note-ref="([^"]+)"/g)].map((m) =>
        m[1]
      );
      for (const id of refs) {
        refsSeen++;
        const n = note(id); // throws on a typo'd id, which fails this test loudly
        assert(
          Boolean(n.href) || Boolean(n.checkedOn),
          `${path}'s note "${id}" has neither an href nor a checkedOn`,
        );
      }
    }
    assert(
      refsSeen > 0,
      "no data-note-ref found on any page — the checks above would pass vacuously",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("no JSON-LD award field carries a money figure", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/");
    const graphs = jsonLd(html) as { "@graph"?: Record<string, unknown>[] }[];
    let awardsSeen = 0;
    for (const block of graphs) {
      for (const node of block["@graph"] ?? []) {
        const award = (node as { award?: unknown }).award;
        if (!Array.isArray(award)) continue;
        for (const entry of award) {
          awardsSeen++;
          assert(
            typeof entry === "string" && !/\$[\d,]/.test(entry),
            `award entry "${entry}" carries a money figure — move it out of "award"`,
          );
        }
      }
    }
    assert(
      awardsSeen > 0,
      "no award field found — the check above would pass vacuously",
    );
  } finally {
    await site.stop();
  }
});
