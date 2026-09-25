// Guards for the single-source rule #186 introduced: a proof figure, a
// promise title or a testimonial may be written only through lib/proof.ts,
// lib/promises.ts and lib/testimonials.ts, and every margin note claim must
// resolve to a real note. The source-scan guards below read every .ts/.tsx
// file under routes/, components/, islands/ and lib/ (excluding the source
// files themselves and every *.test.ts) and fail on a hand-written copy —
// same reasoning as test/no-emoji.test.ts walking rendered pages instead of
// trusting that a fix was applied everywhere.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { proof, proofFigures } from "../lib/proof.ts";
import { promises } from "../lib/promises.ts";
import { testimonials, visibleTestimonials } from "../lib/testimonials.ts";
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

// A quoted `"80"` or `"100%"` string literal is exactly the shape
// routes/index.tsx's proofNumbers array used before this PR
// (`{ value: "80", label: … }`) — a bare, unquoted 80 or 100% is too common
// elsewhere (viewport widths, CSS) to grep for safely, but the quoted-string
// form a hand-written revert of that array would take is specific. One
// legitimate quoted "100%" exists outside lib/proof.ts: islands/MeetEmbed.tsx's
// CSS `width: "100%"`, which is not an Upwork figure — allowlisted by name,
// not by value, so it doesn't quietly cover a real regression.
const QUOTED_LITERAL_ALLOWLIST: Record<string, string[]> = {
  '"100%"': ["islands/MeetEmbed.tsx"],
};

Deno.test('a quoted "80" or "100%" string literal does not restate the proof strip by hand', async () => {
  const files = await sourceFiles(["lib/proof.ts"]);
  for (const needle of ['"80"', '"100%"']) {
    const allowed = QUOTED_LITERAL_ALLOWLIST[needle] ?? [];
    for (const file of files) {
      if (allowed.some((a) => file.endsWith(a))) continue;
      const text = await Deno.readTextFile(file);
      assert(
        !text.includes(needle),
        `${file} hand-writes the quoted literal ${needle} instead of reading lib/proof.ts`,
      );
    }
  }
});

Deno.test('"top 1%" (any case) appears only through lib/proof.ts', async () => {
  const files = await sourceFiles(["lib/proof.ts"]);
  for (const file of files) {
    const text = await Deno.readTextFile(file);
    assert(
      !/top 1%/i.test(text),
      `${file} hand-writes "top 1%" instead of reading lib/proof.ts`,
    );
  }
});

Deno.test("every promise title, phrase (any case) and desc appears in source only through lib/promises.ts", async () => {
  const files = await sourceFiles(["lib/promises.ts"]);
  for (const p of promises) {
    for (const file of files) {
      const text = await Deno.readTextFile(file);
      assert(
        !text.toLowerCase().includes(p.title.toLowerCase()),
        `${file} hand-writes promise title "${p.title}" instead of reading lib/promises.ts`,
      );
      assert(
        !text.toLowerCase().includes(p.phrase.toLowerCase()),
        `${file} hand-writes promise phrase "${p.phrase}" instead of reading lib/promises.ts`,
      );
      assert(
        !text.includes(p.desc),
        `${file} hand-writes promise desc "${p.desc}" instead of reading lib/promises.ts`,
      );
    }
  }
});

// Key terms a paraphrase could restate without quoting a promise's full
// `desc` word for word — the exact drift issue #186 exists to prevent
// ("30 days" in one place, "60 days" in another). Each needle is a phrase
// specific enough to the promise's own wording that it doesn't collide with
// unrelated prose (see FIGURE_NEEDLES above for the same reasoning).
const PROMISE_TERM_NEEDLES: Record<string, string> = {
  "first-milestone": "one or two weeks of work",
  "free-bugfixes": "fixed free for 30 days",
};

Deno.test("key promise terms appear in source only through lib/promises.ts", async () => {
  const files = await sourceFiles(["lib/promises.ts"]);
  for (const [id, needle] of Object.entries(PROMISE_TERM_NEEDLES)) {
    for (const file of files) {
      const text = await Deno.readTextFile(file);
      assert(
        !text.includes(needle),
        `${file} hand-writes promise "${id}"'s term "${needle}" instead of reading lib/promises.ts`,
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

Deno.test("no JSON-LD block on the home page states the earnings figure", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/");
    const scripts = [
      ...html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ].map((m) => m[1]);
    assert(scripts.length > 0, "no JSON-LD block found on /");
    for (const raw of scripts) {
      assert(
        !raw.includes(proof("earned")),
        `a JSON-LD block states the earnings figure ("${
          proof("earned")
        }") — it belongs on the page, not in structured data (#186 review)`,
      );
    }
  } finally {
    await site.stop();
  }
});

// #231: every review is a real, public Upwork review (sourceHref) cleared
// for the site; the unsourced "$55,749" figure and the "consultation" quote
// that matched no review are gone and must not come back.
Deno.test("lib/testimonials.ts holds only sourced reviews and no dollar figure", async () => {
  assert(testimonials.length > 0, "no testimonials");
  assertEquals(visibleTestimonials(testimonials), testimonials);
  const text = await Deno.readTextFile("lib/testimonials.ts");
  assert(!/\$\s?\d/.test(text), "lib/testimonials.ts states a dollar figure");
});
