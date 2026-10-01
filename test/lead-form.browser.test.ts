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
import type { Browser, Page, Route } from "playwright";
import { startSite } from "./harness.ts";
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
} from "./browser.ts";
import { catalogItem } from "../lib/catalog.ts";

const FOCUS_TIMEOUT_MS = 5000;
// Longer than the panels' 500ms CSS transition, so the scroll sampler below
// keeps recording past the point where a scroll jump would show up.
const SCROLL_SAMPLE_WINDOW_MS = 700;
const SUBMIT_SELECTOR = '[data-lead-form] button[type="submit"]';

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
 * Scrolls so the submit button sits at the very bottom edge of the viewport.
 * The scroll jump this test guards against only shows up when the button
 * (and the collapsed success panel right after it) starts at the bottom of
 * the screen — with the button mid-viewport there's already room to reveal
 * the panel without any scrolling, so `focus()` never needs to move the page
 * and a dropped `preventScroll` goes unnoticed. This is done with
 * `window.scrollBy` inside `page.evaluate`, not a Playwright scroll helper,
 * so the position is exact and nothing auto-corrects it afterwards.
 */
async function scrollSubmitButtonToViewportBottom(page: Page): Promise<void> {
  await page.locator(SUBMIT_SELECTOR).evaluate((el) => {
    globalThis.scrollBy(
      0,
      el.getBoundingClientRect().bottom - globalThis.innerHeight,
    );
  });
}

/**
 * Clicks the submit button via `element.click()` inside `page.evaluate`,
 * instead of Playwright's own `locator.click()`. Playwright's click scrolls
 * its target into view as part of its actionability checks — which would
 * silently undo the positioning `scrollSubmitButtonToViewportBottom` just
 * did (confirmed: at 390x844, `page.click()` scrolls even against the fixed,
 * already-correct main branch). A plain DOM `click()` fires the same
 * `onSubmit` handler without touching scroll position at all.
 */
async function clickSubmitButtonWithoutScrolling(page: Page): Promise<void> {
  await page.locator(SUBMIT_SELECTOR).evaluate((el) => {
    (el as HTMLElement).click();
  });
}

/**
 * Starts sampling `window.scrollY` on every animation frame, for
 * `SCROLL_SAMPLE_WINDOW_MS`, into `window.__scrollSamples`. Call right
 * before the click so the very first frames — where an unguarded `.focus()`
 * yanks the page down as the still-collapsed success panel is scrolled into
 * view — are captured.
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
    browser = await launchChromium();

    // Default 1280x720 viewport, deliberately not overridden: it's one of
    // the two sizes (the other being 390x844) confirmed to reproduce the
    // scroll jump against an unfixed heading focus.
    const page: Page = await newPage(browser);
    try {
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

      await scrollSubmitButtonToViewportBottom(page);
      const preSubmitScrollY = await page.evaluate(() => globalThis.scrollY);
      await startScrollSampling(page);
      await clickSubmitButtonWithoutScrolling(page);

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

      // The actual regression guard: with the submit button pinned to the
      // bottom of the viewport, a focus() call without { preventScroll: true }
      // scrolls the page down to the heading's still-collapsed position and
      // back as the success panel expands. Confirmed against this exact test
      // (mutation: drop preventScroll) at all three sizes the bug was found
      // at — 1280x720, 1280x800, 390x844 — and confirmed silent on main and
      // on the fixed code.
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
          `scrollY rose to ${sample} (from ${preSubmitScrollY})`,
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
          "Your brief is queued",
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

/** RFC 2606 host: the calendar's frame never loads, which these tests don't need. */
const PLACEHOLDER_SCHEDULE_URL = "https://meet.example.com";

/** Fills the three fields (keeping any prefilled brief), submits, and waits for the success heading. */
async function submitBrief(page: Page): Promise<void> {
  await page.fill("#lead-name", "Ada Lovelace");
  await page.fill("#lead-email", "ada@example.com");
  await page.locator("#lead-stack").pressSequentially("Deno + Fresh");
  await clickSubmitButtonWithoutScrolling(page);
  await page.waitForFunction(
    () => document.activeElement?.id === "lead-success-heading",
    undefined,
    { timeout: FOCUS_TIMEOUT_MS },
  );
}

Deno.test("on the booking page a brief carries its ?service= slug and its success points up to the one calendar", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const posted: unknown[] = [];
      await page.route("**/api/lead", (route: Route) => {
        posted.push(route.request().postDataJSON());
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      });
      const slug = "codebase-health-audit";
      await page.goto(`${site.origin}/book?service=${slug}`, {
        waitUntil: "networkidle",
      });
      const about = `About: ${catalogItem(slug).shortTitle}`;
      assert(
        (await page.inputValue("#lead-stack")).startsWith(about),
        `the brief is not prefilled with "${about}"`,
      );

      await submitBrief(page);
      assertEquals(posted.length, 1);
      const body = posted[0] as Record<string, unknown>;
      assertEquals(body.service, slug);
      assert(String(body.techStack).startsWith(about));

      assertEquals(
        await page.locator("[data-meet-embed]").count(),
        1,
        "a second calendar appeared after the brief was sent",
      );
      assertEquals(
        await page.locator("[data-lead-success] a[href='#book']").count(),
        1,
        "the success panel does not point up to the calendar",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the home page loads the calendar's script and mounts it only after a successful brief", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.route(
        "**/api/lead",
        (route: Route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true }),
          }),
      );
      const calendarScripts: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes("fresh-island__MeetEmbed")) {
          calendarScripts.push(req.url());
        }
      });
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      assertEquals(
        calendarScripts,
        [],
        "the calendar's script loaded before a submit",
      );
      assertEquals(await page.locator("iframe").count(), 0);
      assertEquals(await page.locator("[data-meet-embed]").count(), 0);

      await submitBrief(page);
      await page.locator("[data-lead-success] [data-meet-embed]").waitFor({
        state: "attached",
      });
      // The calendar's code arrived with the submit, not with the page.
      assert(
        calendarScripts.length > 0,
        "the calendar mounted without fetching its script after the submit",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the booking page's brief refuses to send only the prefilled About line", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      let posts = 0;
      await page.route("**/api/lead", (route: Route) => {
        posts++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      });
      await page.goto(
        `${site.origin}/book?service=codebase-health-audit`,
        { waitUntil: "networkidle" },
      );
      await page.fill("#lead-name", "Ada Lovelace");
      await page.fill("#lead-email", "ada@example.com");
      await clickSubmitButtonWithoutScrolling(page);
      const error = page.locator("#lead-form-error");
      await error.waitFor({ state: "visible" });
      assertEquals(
        await error.innerText(),
        "Describe your idea or your current app",
      );
      assertEquals(
        await page.getAttribute("#lead-stack", "aria-invalid"),
        "true",
      );
      assertEquals(posts, 0, "a brief with only the prefill was sent");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** The brief events a page sent, in order; the calendar's own are left out. */
async function briefEvents(page: Page) {
  return (await trackedCalls(page)).filter(([name]) =>
    name.startsWith("brief")
  );
}

Deno.test("a brief counts as sent only once the server accepts it, with its service", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await recordUmami(page);
      let answer = 500;
      await page.route("**/api/lead", (route: Route) =>
        route.fulfill({
          status: answer,
          contentType: "application/json",
          body: JSON.stringify(answer === 200 ? { ok: true } : { error: "x" }),
        }));
      const slug = "codebase-health-audit";
      await page.goto(`${site.origin}/book?service=${slug}`, {
        waitUntil: "networkidle",
      });
      // The submit button's click is not an event any more.
      assertEquals(
        await page.getAttribute(SUBMIT_SELECTOR, "data-umami-event"),
        null,
        "the submit click is still counted",
      );

      await page.fill("#lead-name", "Ada Lovelace");
      await page.fill("#lead-email", "ada@example.com");
      await page.locator("#lead-stack").pressSequentially("Deno + Fresh");
      await clickSubmitButtonWithoutScrolling(page);
      await page.locator("#lead-form-error").waitFor({ state: "visible" });
      assertEquals(await briefEvents(page), [
        ["brief-error", { reason: "server" }],
      ]);

      answer = 200;
      await clickSubmitButtonWithoutScrolling(page);
      await page.waitForFunction(
        () => document.activeElement?.id === "lead-success-heading",
        undefined,
        { timeout: FOCUS_TIMEOUT_MS },
      );
      assertEquals(await briefEvents(page), [
        ["brief-error", { reason: "server" }],
        ["brief-sent", { service: slug }],
      ]);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a brief the form refuses counts as invalid and never as sent", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await recordUmami(page);
      let posts = 0;
      await page.route("**/api/lead", (route: Route) => {
        posts++;
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid email" }),
        });
      });
      // Only the prefilled About line: the browser lets it through, and the
      // form's own check refuses it.
      await page.goto(
        `${site.origin}/book?service=codebase-health-audit`,
        { waitUntil: "networkidle" },
      );
      await page.fill("#lead-name", "Ada Lovelace");
      await page.fill("#lead-email", "ada@example.com");
      await clickSubmitButtonWithoutScrolling(page);
      await page.locator("#lead-form-error").waitFor({ state: "visible" });
      assertEquals(
        posts,
        0,
        "a brief with only the prefill reached the server",
      );
      assertEquals(await briefEvents(page), [
        ["brief-error", { reason: "invalid" }],
      ]);

      // The server refusing what was typed (400) is invalid too.
      await page.locator("#lead-stack").pressSequentially("Deno + Fresh");
      await clickSubmitButtonWithoutScrolling(page);
      await page.waitForFunction(() =>
        document.querySelector("#lead-form-error")?.textContent ===
          "Invalid email"
      );
      assertEquals(posts, 1);
      assertEquals(await briefEvents(page), [
        ["brief-error", { reason: "invalid" }],
        ["brief-error", { reason: "invalid" }],
      ]);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a brief posts what a bot typed into the off-screen website field, and an empty one for a person", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const posted: Record<string, unknown>[] = [];
      await page.route("**/api/lead", (route: Route) => {
        posted.push(route.request().postDataJSON());
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      });
      await page.goto(`${site.origin}/book`, { waitUntil: "networkidle" });
      await page.fill("#lead-name", "Ada Lovelace");
      await page.fill("#lead-email", "ada@example.com");
      await page.locator("#lead-stack").pressSequentially("Deno + Fresh");
      await page.locator("input[name=_website]").fill(
        "https://spam.example.com",
      );
      await clickSubmitButtonWithoutScrolling(page);
      await page.waitForFunction(() =>
        document.activeElement?.id === "lead-success-heading"
      );
      assertEquals(posted.length, 1);
      assertEquals(posted[0]._website, "https://spam.example.com");

      await page.goto(`${site.origin}/book`, { waitUntil: "networkidle" });
      await submitBrief(page);
      assertEquals(posted[1]._website, "");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
