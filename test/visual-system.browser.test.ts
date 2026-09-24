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

          const inkProbe = document.createElement("div");
          inkProbe.style.display = "none";
          inkProbe.className = "text-ink";
          document.body.appendChild(inkProbe);
          const inkAccentTextRgb = getComputedStyle(inkProbe).color;
          inkProbe.remove();

          const found: string[] = [];
          for (const el of document.querySelectorAll("*")) {
            const bg = getComputedStyle(el).backgroundColor;
            if (bg !== accentRgb) continue;
            // The only allowed use: an element `components/Button.tsx`,
            // `components/BookCallLink.tsx` or a hand-marked primary Book
            // facade (islands/MeetEmbed.tsx, routes/contact-me.tsx) stamped
            // with `data-primary-book` — never guessed from text content
            // ("book" appears in plenty of non-CTA copy) or element shape.
            const isPrimaryBook = el.hasAttribute("data-primary-book");
            if (!isPrimaryBook) {
              found.push(
                `${el.tagName.toLowerCase()}.${
                  Array.from(el.classList).join(".")
                }`,
              );
              continue;
            }
            // The marked element must actually have Ink text — the other
            // half of "Ink text on Accent" that a bg-only check can't see.
            const inkRgb = getComputedStyle(el).color;
            if (inkRgb !== inkAccentTextRgb) {
              found.push(
                `${el.tagName.toLowerCase()}[data-primary-book] has non-Ink text: ${inkRgb}`,
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
      // The home page's H1 (Literata 600) and body text (Plex Sans 400) use
      // both families in their actual rendered text, which is what triggers
      // the browser to load them — document.fonts.ready only waits for
      // *triggered* loads to settle, it doesn't force an unused @font-face
      // declaration to load. A @font-face rule is registered in
      // `document.fonts` the moment the stylesheet parses, regardless of
      // whether the file behind it ever loads successfully — so checking
      // for family names alone (the previous version of this test) passes
      // even when the actual file 404s. `status` is the only field that
      // tells the two apart: it starts "unloaded", and only becomes
      // "loaded" after the browser actually fetched and parsed the file, or
      // "error" if that failed.
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const faces = await page.evaluate(() => {
        // deno-lint-ignore no-explicit-any
        return [...(document.fonts as any)].map((f: FontFace) => ({
          family: f.family,
          weight: f.weight,
          style: f.style,
          status: f.status,
        }));
      });
      const literata600 = faces.find((f) =>
        f.family.includes("Literata") && f.style === "normal" &&
        (f.weight === "600" || f.weight === "600 600")
      );
      const plexSans400 = faces.find((f) =>
        f.family.includes("IBM Plex Sans") && f.style === "normal" &&
        (f.weight === "400" || f.weight === "400 400" ||
          f.weight === "normal")
      );
      assert(
        literata600,
        `no Literata 600 normal face registered, got: ${JSON.stringify(faces)}`,
      );
      assert(
        plexSans400,
        `no IBM Plex Sans 400 normal face registered, got: ${
          JSON.stringify(faces)
        }`,
      );
      assertEquals(
        literata600.status,
        "loaded",
        `Literata 600 must actually load (status "loaded"), got "${literata600.status}"`,
      );
      assertEquals(
        plexSans400.status,
        "loaded",
        `IBM Plex Sans 400 must actually load (status "loaded"), got "${plexSans400.status}"`,
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
