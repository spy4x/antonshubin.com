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

Deno.test("Book goes to /contact-me from the rail and the tab bar on every page, in the same tab", async () => {
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
          link.tag.includes(`href="/contact-me"`),
          `${path}: ${link.tag}`,
        );
        assert(!link.tag.includes("target="), `${path}: ${link.tag}`);
        assert(
          link.tag.includes(`aria-current="false"`),
          `${path}: Book is not marked aria-current="false": ${link.tag}`,
        );
        assert(link.tag.includes("data-primary-book"), `${path}: ${link.tag}`);
        assert(link.text.startsWith("Book"), `${path}: reads "${link.text}"`);
      }
    }
  } finally {
    await site.stop();
  }
});

Deno.test("Book reads Write and goes to the brief on /contact-me when SCHEDULE_URL is unset", async () => {
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
          link.tag.includes(`href="/contact-me#brief"`),
          `${path}: ${link.tag}`,
        );
        assertEquals(link.text, "Write", `${path}: reads "${link.text}"`);
        assert(
          link.tag.includes(`aria-current="false"`),
          `${path}: Write is not marked aria-current="false": ${link.tag}`,
        );
      }
    }
    const contact = await site.html("/contact-me");
    assert(
      contact.includes(`id="brief"`),
      "/contact-me lost its brief anchor",
    );
  } finally {
    await site.stop();
  }
});
