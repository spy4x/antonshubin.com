// #457: /tools/mig, the shared frame around mig's own middle, checked in the
// built HTML. test/tools/mig.browser.test.ts checks the press-to-load calendar.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "../harness.ts";
import { assertToolFrame } from "../tool-frame.ts";
import { count, pageBody, visibleText } from "../html.ts";
import { findTool } from "../../lib/tools.ts";
import { composeFile } from "../../components/tools/mig/MigMiddle.tsx";

const mig = findTool("mig")!;
// RFC 2606 host, so no test can reach the real calendar.
const SCHEDULE = "https://meet.example.com";

Deno.test("/tools/mig wears the frame with the README's claim as its h1 and the booking clip as its hero", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const html = await site.html("/tools/mig");
    assertToolFrame(mig, html);
    const page = pageBody(html);
    assertEquals(mig.headline, "One owner, one link, no database.");
    assert(page.includes('src="/video/tools/mig/poster.webp'), "poster");
    assert(page.includes("/video/tools/mig/demo.webm"), "clip sources");
  } finally {
    await site.stop();
  }
});

Deno.test("/tools/mig shows the compose file pinned to the version its facts card names", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const page = pageBody(await site.html("/tools/mig"));
    const at = page.indexOf('id="mig-compose"');
    assert(at !== -1, "no compose file");
    const code = visibleText(
      `<x ${page.slice(at, page.indexOf("</code>", at))}`,
    );
    const version = page.match(/antonshubin\/mig:(v[\d.]+)/)?.[1];
    assert(version, "no pinned image");
    assertEquals(code, visibleText(composeFile(version)));
    const facts = page.slice(page.indexOf('aria-label="Tool facts"'));
    assert(
      visibleText(facts).includes(`${version} on Docker Hub`),
      "facts version",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("/tools/mig offers its calendar only as a press-to-load link to /book#book, with no iframe before the press", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const page = pageBody(await site.html("/tools/mig"));
    assert(visibleText(page).includes("Try it here"), "no Try it here");
    assert(
      /<a href="\/book#book" data-mig-try="button"[^>]*>Load my calendar here<\/a>/
        .test(page),
      "the button is not a link to /book#book",
    );
    assertEquals(count(page, /<iframe\b/g), 0, "an iframe before the press");
    assert(!preconnectsToScheduler(page), "a preconnect to the scheduler");
  } finally {
    await site.stop();
  }
});

/** True when the page asks the browser to connect to the scheduler early. */
function preconnectsToScheduler(page: string): boolean {
  return /rel="(preconnect|dns-prefetch)"[^>]*meet\.example\.com/.test(page);
}

Deno.test("/tools/mig leaves out Try it here when no booking URL is set", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    const page = pageBody(await site.html("/tools/mig"));
    assert(!visibleText(page).includes("Try it here"), "Try it here");
    assertEquals(count(page, /data-mig-try/g), 0);
  } finally {
    await site.stop();
  }
});

Deno.test("/tools/mig lists the README's six reasons, the email card with its lazy screenshot, and the embed snippet", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const page = pageBody(await site.html("/tools/mig"));
    const why = page.slice(
      page.indexOf("data-mig-why"),
      page.indexOf('id="embed"'),
    );
    const titles = [...why.matchAll(/<h3 id="why-\d"[^>]*>([^<]*)<\/h3>/g)]
      .map((m) => m[1]);
    assertEquals(titles, [
      "Nothing to operate",
      "Config is code",
      "Both clocks, everywhere",
      "Invite and cancel built in",
      "No stranger's text in the guest's inbox",
      "Embeds anywhere",
    ]);
    const shot = why.match(/<img\b[^>]*email-confirmation[^>]*>/)?.[0] ?? "";
    assert(shot.includes('loading="lazy"'), `email shot: ${shot}`);
    assert(page.includes('id="mig-embed"'), "no embed snippet");
    assert(
      visibleText(page).includes("Skip it if You need teams, payments"),
      "Skip it if is not the README's line",
    );
  } finally {
    await site.stop();
  }
});
