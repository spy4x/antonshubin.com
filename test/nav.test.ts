// Guards for issue #185: the nav's Book action is on every page, in both the
// desktop rail and the phone tab bar, and falls back to "Write" when there is
// no booking link. Guards for #433: the library `Rail`'s tab bar, More sheet
// and portrait cell hold what the spec lists. Reads the built site through test/harness.ts — see
// docs/testing.md "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { moreSheet, railColumn, tabBar, visibleText } from "./html.ts";

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

Deno.test("Book goes to /book from the rail and the tab bar on every page, in the same tab", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } });
  try {
    for (const path of await allPaths(site)) {
      const html = await site.html(path);
      const links = [
        ...bookLinks(railColumn(html)),
        ...bookLinks(tabBar(html)),
      ];
      assertEquals(
        links.length,
        2,
        `${path}: expected Book in rail and tab bar`,
      );
      assertEquals(bookLinks(html).length, 2, `${path}: Book drawn elsewhere`);
      for (const link of links) {
        assert(
          link.tag.includes(`href="/book"`),
          `${path}: ${link.tag}`,
        );
        assert(!link.tag.includes("target="), `${path}: ${link.tag}`);
        assertEquals(
          link.tag.match(/aria-current="([^"]*)"/)?.[1],
          path === "/book" ? "page" : "false",
          `${path}: Book is the current page only on /book: ${link.tag}`,
        );
        assert(link.tag.includes("data-primary-book"), `${path}: ${link.tag}`);
        assert(link.text.startsWith("Book"), `${path}: reads "${link.text}"`);
      }
    }
  } finally {
    await site.stop();
  }
});

Deno.test("Book reads Write and goes to the brief on /book when SCHEDULE_URL is unset", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    for (const path of await allPaths(site)) {
      const html = await site.html(path);
      const links = [
        ...bookLinks(railColumn(html)),
        ...bookLinks(tabBar(html)),
      ];
      assertEquals(
        links.length,
        2,
        `${path}: expected Write in rail and tab bar`,
      );
      assertEquals(bookLinks(html).length, 2, `${path}: Write drawn elsewhere`);
      for (const link of links) {
        assert(
          link.tag.includes(`href="/book#brief"`),
          `${path}: ${link.tag}`,
        );
        assertEquals(link.text, "Write", `${path}: reads "${link.text}"`);
        assertEquals(
          link.tag.match(/aria-current="([^"]*)"/)?.[1],
          path === "/book" ? "page" : "false",
          `${path}: Write is the current page only on /book: ${link.tag}`,
        );
      }
    }
    const contact = await site.html("/book");
    assert(
      contact.includes(`id="brief"`),
      "/book lost its brief anchor",
    );
  } finally {
    await site.stop();
  }
});

/** The visible label of each entry in `html`, in order: links and the More button. */
function entryLabels(html: string): string[] {
  return [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => visibleText(m[2]));
}

Deno.test("the phone tab bar is Work, Services, Book in the centre, Tools, More", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } });
  try {
    assertEquals(entryLabels(tabBar(await site.html("/"))), [
      "Work",
      "Services",
      "Book",
      "Tools",
      "More",
    ]);
  } finally {
    await site.stop();
  }
});

Deno.test("the More sheet lists Home, About, How I work, Writing, Infrastructure", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } });
  try {
    const sheet = moreSheet(await site.html("/"));
    const links = [...sheet.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) =>
      m[1]
    );
    assertEquals(links, [
      "/",
      "/about",
      "/how-i-work",
      "/blog",
      "/infrastructure",
    ]);
  } finally {
    await site.stop();
  }
});

Deno.test("the rail's portrait is a library entry linking home with no tooltip", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } });
  try {
    const html = await site.html("/blog");
    // From the end of the top zone's opening tag to the column's list.
    const start = html.indexOf(">", html.indexOf(`data-e2e="rail-shell-top"`));
    const top = html.slice(start + 1, html.indexOf("<nav", start));
    // `RailEntry` draws it, so it is a cell like every other rail entry.
    assert(
      /<a\b(?=[^>]*href="\/")(?=[^>]*data-e2e="rail-shell-entry")[^>]*>/
        .test(top),
      top,
    );
    assert(
      top.includes("photo-64.webp"),
      "the portrait is not in the top zone",
    );
    assertEquals(visibleText(top), "Anton");
    assert(!top.includes("data-rail-tip"), "the portrait draws a tooltip");
  } finally {
    await site.stop();
  }
});
