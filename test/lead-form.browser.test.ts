// Browser-driven guard for issue #157: after the lead form's `/api/lead`
// submit succeeds, a screen reader must be told, and the two `inert` panels
// (islands/LeadForm.tsx) must swap — the form panel becomes inert, the
// success panel stops being inert. None of that is visible in the
// server-rendered HTML the other rendered-page tests read (the form there
// has never succeeded), so it needs a real browser driving real hydrated JS.
//
// Runs under its own task, `deno task test:browser`, with its own permission
// set — see AGENTS.md "Rendered-page tests" for why this file is excluded
// from the plain `deno task test` glob instead of widening that task's
// permissions for every test file.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { chromium } from "playwright";
import { startSite } from "./harness.ts";

const PLAYWRIGHT_VERSION = "1.63.0";

/**
 * True if the element matched by `selector` has the `inert` IDL property set,
 * read as a live DOM property rather than an HTML attribute string — Preact
 * reflects the boolean `inert` prop directly onto the element, so reading the
 * attribute back would miss a hydration-time toggle that never touches the
 * markup.
 */
function isInert(
  page: {
    $eval(selector: string, fn: (el: Element) => boolean): Promise<boolean>;
  },
  selector: string,
): Promise<boolean> {
  return page.$eval(selector, (el) => (el as HTMLElement).inert);
}

Deno.test("lead form announces success and swaps the inert panels", async () => {
  const site = await startSite();
  // deno-lint-ignore no-explicit-any
  let browser: any;
  try {
    try {
      // CI (Woodpecker/denoland/deno:2.9.0) runs this container as root, and
      // Chromium's own sandbox refuses to start as root without this flag.
      // Harmless here: the browser only ever loads the site this test just
      // booted, never third-party content.
      browser = await chromium.launch({ args: ["--no-sandbox"] });
    } catch (cause) {
      const installCmd =
        `deno run -A npm:playwright@${PLAYWRIGHT_VERSION} install chromium`;
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `chromium.launch() failed — no compatible Chromium build found. ` +
          `Install one with \`${installCmd}\` ` +
          `(see AGENTS.md "Rendered-page tests" for why this test needs its ` +
          `own task). Original error: ${reason}`,
        { cause },
      );
    }

    const page = await browser.newPage();
    try {
      await page.route(
        "**/api/lead",
        (route: { fulfill: (o: unknown) => Promise<void> }) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true }),
          }),
      );

      // "load" alone can beat the LeadForm island's hydration bundle, which
      // is still an in-flight <script type="module"> request at that point;
      // clicking submit before that script runs falls through to the plain
      // HTML form submission instead of the fetch handler, and the test hangs
      // waiting for a focus move that never happens. `networkidle` waits out
      // that script load first.
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

      assertEquals(
        await isInert(page, "[data-lead-form]"),
        false,
        "form panel must not be inert before submit",
      );
      assertEquals(
        await isInert(page, "[data-lead-success]"),
        true,
        "success panel must be inert before submit",
      );

      await page.fill("#lead-name", "Ada Lovelace");
      await page.fill("#lead-email", "ada@example.com");
      await page.fill("#lead-stack", "Deno + Fresh, looking for a review");
      await page.click('button[type="submit"]');

      // A CSS-visibility wait (Playwright's default `waitForSelector` state)
      // races the panel's own 500ms transition; wait for the actual focus
      // instead, which is what a screen reader reacts to.
      await page.waitForFunction(
        () => document.activeElement?.id === "lead-success-heading",
      );

      assertEquals(
        await page.evaluate(() => document.activeElement?.id),
        "lead-success-heading",
        "focus must land on the success heading after a successful submit",
      );

      assertEquals(
        await isInert(page, "[data-lead-form]"),
        true,
        "form panel must become inert after a successful submit",
      );
      assertEquals(
        await isInert(page, "[data-lead-success]"),
        false,
        "success panel must stop being inert after a successful submit",
      );

      assert(
        (await page.textContent("#lead-success-heading"))?.includes(
          "Your audit is queued",
        ),
        "the focused heading must carry the success text a screen reader announces",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
