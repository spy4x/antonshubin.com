// Browser-driven guards for the visual system (#184): typography, the
// accent colour's one reserved use, and that the self-hosted fonts actually
// load. None of this is checkable from raw server-rendered HTML — it needs
// computed styles and `document.fonts`, same reasoning as
// test/a11y.browser.test.ts and test/contrast.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

/** Booking buttons only render when SCHEDULE_URL is set (#175) — same
 * placeholder test/contrast.browser.test.ts uses. */
const PLACEHOLDER_SCHEDULE_URL = "https://cal.example.com/book";

/** A handful of representative pages, covering headings, nav, buttons and
 * body text in different contexts — the same sampling reasoning
 * test/csp.browser.test.ts and test/contrast.browser.test.ts use rather than
 * crawling the full sitemap on every push. */
const PAGES = ["/", "/catalog", "/how-i-work", "/blog/ship-it-today"];

Deno.test("no monospace font renders in a heading, nav item or button (#184)", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage();
    try {
      for (const path of PAGES) {
        await page.goto(`${site.origin}${path}`, {
          waitUntil: "networkidle",
        });
        const offenders = await page.evaluate(() => {
          const selectors = [
            "h1",
            "h2",
            "h3",
            "nav a",
            "nav button",
            "button",
            'a[class*="rounded-lg"]',
          ];
          const found: string[] = [];
          for (const el of document.querySelectorAll(selectors.join(","))) {
            const family = getComputedStyle(el).fontFamily.toLowerCase();
            if (family.includes("mono")) {
              found.push(
                `${el.tagName.toLowerCase()} "${
                  (el.textContent ?? "").trim().slice(0, 40)
                }": ${family}`,
              );
            }
          }
          return found;
        });
        assertEquals(
          offenders,
          [],
          `${path} must render no heading/nav/button in a monospace font`,
        );
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the accent colour is a background only on the primary button and the nav's Book (#184)", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage();
    try {
      for (const path of PAGES) {
        await page.goto(`${site.origin}${path}`, {
          waitUntil: "networkidle",
        });
        const offenders = await page.evaluate(() => {
          // getComputedStyle resolves the --color-accent custom property to
          // its painted rgb() value, so the probe reads the token itself
          // rather than hardcoding the hex — a token edit can't silently
          // desync this test from assets/styles.css.
          const probe = document.createElement("div");
          probe.style.display = "none";
          probe.className = "bg-accent";
          document.body.appendChild(probe);
          const accentRgb = getComputedStyle(probe).backgroundColor;
          probe.remove();

          const found: string[] = [];
          for (const el of document.querySelectorAll("*")) {
            const bg = getComputedStyle(el).backgroundColor;
            if (bg !== accentRgb) continue;
            // A link whose href is the booking URL (the nav's Book, or any
            // page's primary "Book a ... call" action) is the one allowed use.
            const href = (el as HTMLAnchorElement).href ?? "";
            const isBookingLink = href.includes("cal.example.com");
            // A <button type="button"> with no href, used by
            // islands/MeetEmbed.tsx's click-to-load facade, is the other
            // allowed shape of the same Book action.
            const isBookingButton = el.tagName === "BUTTON" &&
              (el.textContent ?? "").toLowerCase().includes("book");
            if (!isBookingLink && !isBookingButton) {
              found.push(
                `${el.tagName.toLowerCase()}.${
                  Array.from(el.classList).join(".")
                }`,
              );
            }
          }
          return found;
        });
        assertEquals(
          offenders,
          [],
          `${path} must paint the accent background only on the Book action, found: ${
            offenders.join(", ")
          }`,
        );
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Literata and IBM Plex Sans load from self with no CSP violation (#184)", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage();
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("Content Security")) {
        violations.push(msg.text());
      }
    });
    try {
      await page.goto(site.origin, { waitUntil: "networkidle" });
      // Force both font families to actually be used and requested, then
      // wait for the font-face set to settle.
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const families = await page.evaluate(() => {
        const names = new Set<string>();
        // deno-lint-ignore no-explicit-any
        (document.fonts as any).forEach((f: FontFace) => names.add(f.family));
        return [...names];
      });
      assert(
        families.some((f) => f.includes("Literata")),
        `document.fonts must include Literata, got: ${families.join(", ")}`,
      );
      assert(
        families.some((f) => f.includes("IBM Plex Sans")),
        `document.fonts must include IBM Plex Sans, got: ${
          families.join(", ")
        }`,
      );

      // Every font request must be same-origin: font-src 'self' in
      // lib/csp.ts allows nothing else, and a font pulled from a CDN would
      // both violate that policy and defeat the point of self-hosting.
      const requests = await page.evaluate(() =>
        performance.getEntriesByType("resource")
          .map((r) => (r as PerformanceResourceTiming).name)
          .filter((n) => n.includes(".woff"))
      );
      assert(
        requests.length > 0,
        "the home page must request at least one font file",
      );
      for (const url of requests) {
        assert(
          new URL(url).origin === site.origin,
          `font request must be same-origin, got ${url}`,
        );
      }

      assertEquals(
        violations,
        [],
        "loading the fonts must not trigger a CSP violation",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
