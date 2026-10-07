// Browser-driven guards for the visual system (#184): typography, the
// accent colour's one reserved use, and that the self-hosted fonts actually
// load. None of this is checkable from raw server-rendered HTML — it needs
// computed styles and `document.fonts`, same reasoning as
// test/a11y.browser.test.ts and test/contrast.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

/** Booking buttons only render when SCHEDULE_URL is set (#175) — same
 * placeholder test/contrast.browser.test.ts uses. */
const PLACEHOLDER_SCHEDULE_URL = "https://cal.example.com/book";

/** A handful of representative pages, covering headings, nav, buttons and
 * body text in different contexts — the same sampling reasoning
 * test/csp.browser.test.ts and test/contrast.browser.test.ts use rather than
 * crawling the full sitemap on every push. */
const PAGES = [
  "/",
  "/catalog",
  "/how-i-work",
  "/blog/ship-it-today",
  "/tools",
  "/tools/ts-libs",
];

Deno.test("no monospace font renders in a heading, nav item or button (#184)", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser);
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
    const page: Page = await newPage(browser);
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
            // `components/BookCallLink.tsx` or another hand-marked primary
            // Book action stamped
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
    const page: Page = await newPage(browser);
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

/** The project gallery's counter row: the counter plus Previous and Next. */
const GALLERY_NAV_ROW = "div:has(> [data-gallery-counter])";
const GALLERY_NAV_BUTTONS = `${GALLERY_NAV_ROW} > button`;

/** The painted value of a site colour token, read through a hidden probe. */
function tokenColour(page: Page, className: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.display = "none";
    probe.className = name;
    document.body.appendChild(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, className);
}

// The strip renders the library's `navigationVariant="ghost"` (#571): the
// site's secondary look, a transparent button inside a Rule strong border,
// instead of the `outline` variant's Paper fill. Hover still fills it.
Deno.test("the project gallery's Previous and Next are transparent inside a Rule strong border and fill on hover (#571)", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    });
    try {
      await page.goto(`${site.origin}/work/smartlite`, {
        waitUntil: "networkidle",
      });
      const buttons = page.locator(GALLERY_NAV_BUTTONS);
      await buttons.first().waitFor({ state: "visible" });
      const ruleStrong = await tokenColour(page, "bg-rule-strong");
      const lamp = await tokenColour(page, "bg-lamp");
      const look = await buttons.evaluateAll((list) =>
        list.map((el) => {
          const style = getComputedStyle(el);
          return {
            background: style.backgroundColor,
            border:
              `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
          };
        })
      );
      assertEquals(
        look,
        [0, 1].map(() => ({
          background: "rgba(0, 0, 0, 0)",
          border: `1px solid ${ruleStrong}`,
        })),
      );

      // Next is enabled at the first slide; the pointer over it fills it Lamp.
      const next = page.locator(
        `${GALLERY_NAV_BUTTONS}[aria-label="Next screenshot"]`,
      );
      await next.hover();
      await page.waitForFunction(
        ([selector, colour]) => {
          const el = document.querySelector(selector);
          return el !== null && getComputedStyle(el).backgroundColor === colour;
        },
        [`${GALLERY_NAV_BUTTONS}[aria-label="Next screenshot"]`, lamp],
        { timeout: 2_000 },
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

// assets/styles.css reserves the row's 40px (the buttons' height) from first
// paint, so the buttons the strip adds after hydration move nothing below
// it. Checked without JavaScript (the server render: no buttons) and after
// hydration, at both widths.
Deno.test("the project gallery's counter row is 40px tall with and without Previous and Next", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const seen: string[] = [];
    for (const width of [390, 1440]) {
      for (const javaScriptEnabled of [false, true]) {
        const page: Page = await newPage(browser, {
          viewport: { width, height: 900 },
          javaScriptEnabled,
        });
        try {
          await page.goto(`${site.origin}/work/smartlite`, {
            waitUntil: "networkidle",
          });
          if (javaScriptEnabled && width === 390) {
            await page.locator(GALLERY_NAV_BUTTONS).first().waitFor({
              state: "visible",
            });
          }
          const row = await page.locator(GALLERY_NAV_ROW).evaluate((el) => ({
            height: el.getBoundingClientRect().height,
            buttons: el.querySelectorAll(":scope > button").length,
          }));
          const label = `${width}px, JS ${javaScriptEnabled ? "on" : "off"}`;
          seen.push(`${label}: ${row.buttons} buttons`);
          assertEquals(row.height, 40, `${label}: ${JSON.stringify(row)}`);
        } finally {
          await page.close();
        }
      }
    }
    // Both cases this test is named after must have happened.
    assert(seen.some((s) => s.endsWith(": 0 buttons")), seen.join("; "));
    assert(seen.some((s) => s.endsWith(": 2 buttons")), seen.join("; "));
  } finally {
    await browser?.close();
    await site.stop();
  }
});
