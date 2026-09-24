// No-emoji guard (#184): the visual system replaces every emoji "icon" with
// a real icon from components/Icons.tsx or drops it, so meaning lives in
// words, not in glyphs that render differently per OS and are invisible to a
// screen reader when not explicitly labelled. This walks every page listed
// in /sitemap.xml plus /pay (deliberately left out of the sitemap — it's
// noindex, same reasoning as test/rendered.test.ts's NON_SITEMAP_PAGES) and
// fails loudly on the first Extended_Pictographic character found, printing
// which page and character.
//
// The copyright/registered/trademark symbols and plain digit keycaps are
// technically Extended_Pictographic but aren't "emoji" in the sense this
// guard cares about (a footer "© 2026" isn't an emoji regression), so
// they're excluded explicitly rather than narrowing the Unicode range, which
// would risk missing a real emoji that happens to share a block.
import { assert } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { visibleText } from "./html.ts";

const ALLOWED = new Set(["©", "®", "™"]);

/** Extended_Pictographic minus plain ASCII digits/#/* (which the property
 * also covers, as the base of keycap sequences like "1️⃣") and the allowed
 * symbols above. */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

function findEmoji(text: string): string[] {
  const matches = text.match(EMOJI_PATTERN) ?? [];
  return matches.filter((ch) => !ALLOWED.has(ch) && !/[0-9#*]/.test(ch));
}

async function sitemapPaths(site: { html(path: string): Promise<string> }) {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

const NON_SITEMAP_PAGES = ["/pay", "/llms.txt", "/llms-full.txt"];

Deno.test("no emoji renders on any page in the sitemap (#184)", async (t) => {
  const site = await startSite();
  try {
    const paths = [...await sitemapPaths(site), ...NON_SITEMAP_PAGES];
    assert(
      paths.length > NON_SITEMAP_PAGES.length,
      "sitemap.xml is empty — the loop below would pass vacuously",
    );
    for (const path of paths) {
      await t.step(path, async () => {
        const html = await site.html(path);
        const text = visibleText(html);
        const found = findEmoji(text);
        assert(
          found.length === 0,
          `${path} renders emoji: ${
            found.map((ch) => `"${ch}" (U+${ch.codePointAt(0)!.toString(16)})`)
              .join(", ")
          }`,
        );
      });
    }
  } finally {
    await site.stop();
  }
});
