// #454: every tool page, custom or not, wears the shared tool frame, and a
// clip's files exist once its entry says they do.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { assertToolFrame } from "./tool-frame.ts";
import { clipSources, tools } from "../lib/tools.ts";
import { MORE_TOOLS } from "../components/tool-frame/ToolMore.tsx";
import { pageBody, visibleText } from "./html.ts";

/** The visible text from the tag holding `start` to the first `end` after it. */
function textFrom(page: string, start: string, end: string): string {
  const from = page.indexOf(start);
  return visibleText(`<x ${page.slice(from, page.indexOf(end, from))}`);
}

Deno.test("every tool page renders the frame's top line, hero, facts card, band with its one Book and More tools", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      assertToolFrame(t, html);
      assert(html.includes("data-primary-book"), `${t.slug}: no Book`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("a clip marked as committed has its WebM, MP4 and poster under static/", async () => {
  for (const t of tools.filter((t) => t.clip?.video)) {
    for (
      const src of [
        ...clipSources(t.slug).map((s) => s.src),
        t.clip!.poster.src,
      ]
    ) {
      const info = await Deno.stat(`static${src}`).catch(() => null);
      assert(info?.isFile, `${t.slug}: static${src} is missing`);
    }
  }
});

Deno.test("every tool has three hand-picked More tools: registered, distinct and not itself", () => {
  const slugs = new Set(tools.map((t) => t.slug));
  assertEquals(Object.keys(MORE_TOOLS).sort(), [...slugs].sort());
  for (const [slug, picks] of Object.entries(MORE_TOOLS)) {
    assertEquals(new Set(picks).size, 3, `${slug}: repeats a pick`);
    for (const pick of picks) {
      assert(slugs.has(pick) && pick !== slug, `${slug}: picks ${pick}`);
    }
  }
});

Deno.test("no tool page repeats its lede under What it is", async () => {
  const site = await startSite();
  try {
    for (const t of tools) {
      const page = pageBody(await site.html(`/tools/${t.slug}`));
      if (!page.includes('id="what"')) continue;
      const lede = textFrom(page, "data-tool-lede", "</p>");
      const what = textFrom(page, 'id="what"', "</section>");
      for (const sentence of lede.split(/(?<=[.!?])\s+/)) {
        assert(!what.includes(sentence), `${t.slug}: "${sentence}" twice`);
      }
    }
  } finally {
    await site.stop();
  }
});
