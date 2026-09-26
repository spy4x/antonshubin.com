// Guards for issue #185: the nav's Book action is on every page, in both the
// desktop rail and the phone tab bar, and falls back to "Write" when there is
// no booking link. Reads the built site through test/harness.ts — see
// AGENTS.md "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { visibleText } from "./html.ts";

const SCHEDULE_URL = "https://meet.example.com/book";

/** Every page in the sitemap, plus `/pay`, which the sitemap leaves out. */
async function allPaths(site: Site): Promise<string[]> {
  const sitemap = await site.html("/sitemap.xml");
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname);
  assert(paths.length > 10, "sitemap looks empty");
  return [...paths, "/pay"];
}

/** The nav's Book links on `html`: `{ tag, text }` for each `data-nav-book` anchor. */
function bookLinks(html: string): { tag: string; text: string }[] {
  return [...html.matchAll(/(<a\b[^>]*data-nav-book[^>]*>)([\s\S]*?)<\/a>/g)]
    .map((m) => ({ tag: m[1], text: visibleText(m[2]) }));
}

Deno.test("Book links the booking page from the rail and the tab bar on every page", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } });
  try {
    for (const path of await allPaths(site)) {
      const links = bookLinks(await site.html(path));
      assertEquals(
        links.length,
        2,
        `${path}: expected Book in rail and tab bar`,
      );
      for (const link of links) {
        assert(
          link.tag.includes(`href="${SCHEDULE_URL}"`),
          `${path}: ${link.tag}`,
        );
        assert(link.tag.includes("data-primary-book"), `${path}: ${link.tag}`);
        assert(link.text.startsWith("Book"), `${path}: reads "${link.text}"`);
      }
    }
  } finally {
    await site.stop();
  }
});

Deno.test("Book reads Write and links the brief form when SCHEDULE_URL is unset", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    for (const path of await allPaths(site)) {
      const links = bookLinks(await site.html(path));
      assertEquals(
        links.length,
        2,
        `${path}: expected Write in rail and tab bar`,
      );
      for (const link of links) {
        assert(
          link.tag.includes(`href="/#audit-form"`),
          `${path}: ${link.tag}`,
        );
        assertEquals(link.text, "Write", `${path}: reads "${link.text}"`);
      }
    }
    const home = await site.html("/");
    assert(
      home.includes(`id="audit-form"`),
      "the home page lost its brief form anchor",
    );
  } finally {
    await site.stop();
  }
});
