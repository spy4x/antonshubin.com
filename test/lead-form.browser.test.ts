// Browser-driven guard for issue #157: after the lead form's `/api/lead`
// submit succeeds, a screen reader must be told, the two `inert` panels
// (islands/LeadForm.tsx) must swap — the form panel becomes inert, the
// success panel stops being inert — and the page must not visibly jump while
// that happens. None of that is visible in the server-rendered HTML the other
// rendered-page tests read (the form there has never succeeded), so it needs
// a real browser driving real hydrated JS.
//
// Runs under its own task, `deno task test:browser`, with its own permission
// set — see AGENTS.md "Rendered-page tests" for why this file is excluded
// from the plain `deno task test` glob instead of widening that task's
// permissions for every test file.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { chromium } from "playwright";
import type { Browser, Page, Route } from "playwright";
import { startSite } from "./harness.ts";

const PLAYWRIGHT_VERSION = "1.63.0";
const FOCUS_TIMEOUT_MS = 5000;
// Longer than the panels' 500ms CSS transition, so the scroll sampler (below)
// keeps recording past the point where a scroll jump would show up.
const SCROLL_SAMPLE_WINDOW_MS = 700;

interface FocusCall {
  id: string;
  preventScroll: boolean;
}

/**
 * True if the element matched by `selector` has the `inert` IDL property set,
 * read as a live DOM property rather than an HTML attribute string — Preact
 * reflects the boolean `inert` prop directly onto the element, so reading the
 * attribute back would miss a hydration-time toggle that never touches the
 * markup.
 */
function isInert(page: Page, selector: string): Promise<boolean> {
  return page.$eval(selector, (el) => (el as HTMLElement).inert);
}

/**
 * Patches `HTMLElement.prototype.focus` (before the page's own scripts run)
 * to record every call's element id and whether `preventScroll` was set, into
 * `window.__focusCalls`. This is what actually makes the "no scroll jump"
 * guard deterministic: it checks the option the code passed, not a visual
 * side effect. Reading `window.scrollY` alone (see `startScrollSampling`
 * below) turned out to depend on the exact layout position `startSite()`'s
 * page happens to load at and on the rendering backend's timing — it caught
 * the jump when reproducing this issue manually, but not reliably across
 * viewports and browser builds, so it isn't load-bearing here on its own.
 */
async function installFocusSpy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const nativeFocus = HTMLElement.prototype.focus;
    (globalThis as unknown as { __focusCalls: FocusCall[] }).__focusCalls = [];
    HTMLElement.prototype.focus = function (
      this: HTMLElement,
      options?: FocusOptions,
    ) {
      (globalThis as unknown as { __focusCalls: FocusCall[] }).__focusCalls
        .push({
          id: this.id,
          preventScroll: options?.preventScroll === true,
        });
      return nativeFocus.call(this, options);
    };
  });
}

function readFocusCalls(page: Page): Promise<FocusCall[]> {
  return page.evaluate(() =>
    (globalThis as unknown as { __focusCalls: FocusCall[] }).__focusCalls
  );
}

/**
 * Starts sampling `window.scrollY` on every animation frame, for
 * `SCROLL_SAMPLE_WINDOW_MS`, into `window.__scrollSamples`. Call before the
 * action under test (the submit click) so the very first frames — where an
 * unguarded `.focus()` would yank the page down — are captured. See the
 * caveat on `installFocusSpy` above: this is a real-behaviour supplement, not
 * the primary guard.
 */
function startScrollSampling(page: Page): Promise<void> {
  return page.evaluate((windowMs) => {
    const samples: number[] = [];
    (globalThis as unknown as { __scrollSamples: number[] }).__scrollSamples =
      samples;
    const start = performance.now();
    const tick = () => {
      samples.push(globalThis.scrollY);
      if (performance.now() - start < windowMs) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, SCROLL_SAMPLE_WINDOW_MS);
}

function readScrollSamples(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    (globalThis as unknown as { __scrollSamples: number[] }).__scrollSamples
  );
}

Deno.test("lead form announces success, swaps inert panels, and does not scroll", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    try {
      // CI (Woodpecker/denoland/deno:2.9.0) runs this container as root, and
      // Chromium's own sandbox refuses to start as root without this flag.
      // Harmless here: the browser only ever loads the site this test just
      // booted, never third-party content.
      browser = await chromium.launch({ args: ["--no-sandbox"] });
    } catch (cause) {
      const installCmd =
        `deno run -A npm:playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium`;
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `chromium.launch() failed — no compatible Chromium build found. ` +
          `Install one with \`${installCmd}\` ` +
          `(see AGENTS.md "Rendered-page tests" for why this test needs its ` +
          `own task). Original error: ${reason}`,
        { cause },
      );
    }

    const page: Page = await browser.newPage();
    try {
      await installFocusSpy(page);
      await page.route(
        "**/api/lead",
        (route: Route) =>
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

      const preSubmitScrollY = await page.evaluate(() => globalThis.scrollY);
      await startScrollSampling(page);
      await page.click('[data-lead-form] button[type="submit"]');

      try {
        await page.waitForFunction(
          () => document.activeElement?.id === "lead-success-heading",
          undefined,
          { timeout: FOCUS_TIMEOUT_MS },
        );
      } catch (cause) {
        throw new Error(
          `focus never landed on #lead-success-heading within ` +
            `${FOCUS_TIMEOUT_MS}ms of submit — the success heading's ` +
            `useEffect focus() call in islands/LeadForm.tsx may be missing ` +
            `or broken`,
          { cause },
        );
      }

      // Deterministic guard: the code must call focus({ preventScroll: true })
      // on the success heading. This is what a dropped `preventScroll` option
      // actually fails on — see the comment on installFocusSpy for why the
      // scrollY sampling below isn't relied on alone.
      const focusCalls = await readFocusCalls(page);
      const successFocusCall = focusCalls.find((call) =>
        call.id === "lead-success-heading"
      );
      assert(
        successFocusCall,
        "expected a focus() call on #lead-success-heading after submit",
      );
      assert(
        successFocusCall.preventScroll,
        "focus() on #lead-success-heading must pass { preventScroll: true } " +
          "— without it, the still-collapsing success panel causes a visible " +
          "scroll jump as the browser scrolls to the element's pre-transition " +
          "position",
      );

      // Real-behaviour supplement: while the panels animate, the page should
      // also never actually scroll further down than where it started.
      await page.waitForTimeout(SCROLL_SAMPLE_WINDOW_MS);
      const scrollSamples = await readScrollSamples(page);
      assert(
        scrollSamples.length > 0,
        "no scroll samples were collected — the sampler in the test itself " +
          "never started",
      );
      for (const sample of scrollSamples) {
        assert(
          sample <= preSubmitScrollY,
          `scrollY rose to ${sample} (from ${preSubmitScrollY}) while the ` +
            `success panel animated in — the success heading's focus() call ` +
            `must pass { preventScroll: true }`,
        );
      }

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
