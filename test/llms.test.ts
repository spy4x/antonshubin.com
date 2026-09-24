// Guards routes/llms.txt.ts and routes/llms-full.txt.ts against an in-place
// `blogArticles.sort()`: since `blogArticles` is a module-level array shared
// by every request in the process, sorting it in place in either route used
// to reorder "Read next" on every blog post page after the first fetch of
// that route. See AGENTS.md "Rendered-page tests".
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
