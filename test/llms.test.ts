// Guards routes/llms-full.txt.ts against re-introducing the in-place
// `blogArticles.sort()` bug: since `blogArticles` is a module-level array
// shared by every request in the process, sorting it in place there used to
// reorder "Read next" on every blog post page after the first fetch of
// /llms-full.txt. See AGENTS.md "Rendered-page tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

/** Extracts the `/blog/<slug>` hrefs inside the "Read next" section, in order. */
function readNextSlugs(html: string): string[] {
  const sectionStart = html.indexOf("Read next");
  if (sectionStart === -1) return [];
  const section = html.slice(sectionStart, sectionStart + 4000);
  const matches = [...section.matchAll(/href="\/blog\/([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

Deno.test("fetching /llms-full.txt does not change blog 'Read next' order", async () => {
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

    const llmsRes = await site.get("/llms-full.txt");
    assertEquals(llmsRes.status, 200);
    await llmsRes.text();

    const after = readNextSlugs(await site.html(path));
    assertEquals(after, before);
  } finally {
    await site.stop();
  }
});
