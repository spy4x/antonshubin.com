// Guards routes/llms.txt.ts and routes/llms-full.txt.ts against an in-place
// `blogArticles.sort()`: since `blogArticles` is a module-level array shared
// by every request in the process, sorting it in place in either route used
// to reorder "Read next" on every blog post page after the first fetch of
// that route. See AGENTS.md "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { formatPeriod, projects } from "../lib/data.ts";

/** Extracts the `/blog/<slug>` hrefs inside the "Read next" section, in order. */
function readNextSlugs(html: string): string[] {
  const sectionStart = html.indexOf("Read next");
  if (sectionStart === -1) return [];
  const section = html.slice(sectionStart, sectionStart + 4000);
  const matches = [...section.matchAll(/href="\/blog\/([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

Deno.test("neither llms file lists the YouTube channel as an open-source project", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(llmsPath);
      assertEquals(
        text.includes("YouTube Tech Channel"),
        false,
        `${llmsPath} lists the YouTube channel among the open-source projects`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("both llms files say what the strongest client case study is, not only its outcome", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(llmsPath);
      assertEquals(
        text.includes("Gardens by the Bay"),
        true,
        `${llmsPath} dropped SmartLite's venue from its client line`,
      );
      assertEquals(
        text.includes("Built for Yumetronics, 2024\u2013now."),
        true,
        `${llmsPath} dropped SmartLite's client from its client line`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("every client project line in both llms files carries its period", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const lines = (await site.html(llmsPath)).split("\n");
      let checked = 0;
      for (const p of projects.freelance) {
        const line = lines.find((l) =>
          l.startsWith("- ") && l.includes(`/projects/${p.slug})`)
        );
        if (!line) continue;
        checked++;
        assert(
          line.includes(formatPeriod(p.period!)),
          `${llmsPath}: the ${p.slug} line lacks ${formatPeriod(p.period!)}`,
        );
      }
      assert(checked >= 2, `${llmsPath}: only ${checked} client lines found`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("fetching /llms.txt or /llms-full.txt does not change blog 'Read next' order", async () => {
  const site = await startSite();
  try {
    // A dev-tips post with several dev-tips siblings, so "Read next" has a
    // real order to disturb.
    const path = "/blog/the-importance-of-code-formatting-with-prettier";

    const before = readNextSlugs(await site.html(path));
    assertEquals(
      before.length > 0,
      true,
      "the fixture post has no 'Read next' section — pick a post with related articles",
    );

    // Both llms routes build a blog-post list; either one sorting the shared
    // blogArticles array in place would reorder "Read next" afterwards.
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const res = await site.get(llmsPath);
      assertEquals(res.status, 200, llmsPath);
      await res.text();

      const after = readNextSlugs(await site.html(path));
      assertEquals(after, before, `order changed after fetching ${llmsPath}`);
    }
  } finally {
    await site.stop();
  }
});
