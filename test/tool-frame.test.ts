// #454: every tool page, custom or not, wears the shared tool frame, and a
// clip's files exist once its entry says they do.
import { assert } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { assertToolFrame } from "./tool-frame.ts";
import { clipSources, tools } from "../lib/tools.ts";

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
