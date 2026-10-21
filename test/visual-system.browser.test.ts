// Browser-driven guards for the visual system (#184): typography, the
// accent colour's one reserved use, and that the self-hosted fonts actually
// load. None of this is checkable from raw server-rendered HTML — it needs
// computed styles and `document.fonts`, same reasoning as
// test/a11y.browser.test.ts and test/contrast.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage, WAIT_MS } from "./browser.ts";

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
  "/tools/seed",
  // The ThemePreview frame repaints its buttons in the library's own brand.
  "/tools/preact-components",
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

// The strip renders the library's `navigationVariant="ghost"` (preact-components#571): the
// site's secondary look, a transparent button inside a Rule strong border,
// instead of the `outline` variant's Paper fill. Hover still fills it.
Deno.test("the project gallery's Previous and Next are transparent inside a Rule strong border and fill on hover (preact-components#571)", async () => {
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

/** Pages outside the sitemap that the accent scan also visits: the payment
 * page, a not-found URL, and the two mailing-list pages (opened without a
 * token, so they render their "this link is not valid" state). */
const ACCENT_EXTRA_PAGES = [
  "/pay",
  "/no-such-page",
  "/unsubscribe",
  "/subscribe/confirm",
];

/**
 * Runs in the page. Lists what paints the accent (or its hover shade) inside
 * `root` anywhere but its background: text, a border side that has a width,
 * an outline that has a width, an underline, a focus ring (a box shadow) or
 * an SVG fill or stroke. Elements inside `[data-primary-book]` are skipped,
 * and so are elements that are not rendered. The two colours are read from
 * the `--color-accent` tokens through a probe, so a token edit cannot desync
 * this from `assets/styles.css`.
 */
function accentPaint(root: Element): string[] {
  const probe = document.createElement("div");
  probe.style.display = "none";
  document.body.appendChild(probe);
  const accents = ["--color-accent", "--color-accent-hover"].map((token) => {
    probe.style.color = `var(${token})`;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  const isAccent = (colour: string) => accents.includes(colour);

  const found: string[] = [];
  for (const el of [root, ...root.querySelectorAll("*")]) {
    if (el.closest("[data-primary-book]")) continue;
    if (el.getClientRects().length === 0) continue;
    const style = getComputedStyle(el);
    const painted: string[] = [];
    // An inherited text colour is reported once, on the element that sets it.
    const parent = el.parentElement;
    if (
      isAccent(style.color) &&
      !(parent && isAccent(getComputedStyle(parent).color))
    ) {
      painted.push("text");
    }
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      if (
        parseFloat(style[`border${side}Width`]) > 0 &&
        isAccent(style[`border${side}Color`])
      ) {
        painted.push(`border-${side.toLowerCase()}`);
      }
    }
    if (parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== "none") {
      if (isAccent(style.outlineColor)) painted.push("outline");
    }
    if (
      style.textDecorationLine !== "none" &&
      isAccent(style.textDecorationColor) && !isAccent(style.color)
    ) {
      painted.push("underline");
    }
    if (accents.some((accent) => style.boxShadow.includes(accent))) {
      painted.push("ring");
    }
    if (el instanceof SVGElement) {
      if (isAccent(style.fill)) painted.push("fill");
      if (isAccent(style.stroke)) painted.push("stroke");
    }
    if (painted.length > 0) {
      const classes = Array.from(el.classList).join(".");
      const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(
        0,
        30,
      );
      found.push(
        `${el.tagName.toLowerCase()}${classes && "." + classes} "${text}": ${
          painted.join(", ")
        }`,
      );
    }
  }
  return found;
}

Deno.test("nothing outside the Book action paints the accent as text, border, underline or icon colour on any sitemap page (#365)", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    const sitemap = await site.html("/sitemap.xml");
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const url = new URL(m[1]);
      return url.pathname + url.search;
    });
    assert(paths.length > 20, `the sitemap lists ${paths.length} pages`);
    assert(paths.includes("/"), "the sitemap lists the home page");

    browser = await launchChromium();
    const page: Page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      const offenders: string[] = [];
      let bookActions = 0;
      for (const path of [...paths, ...ACCENT_EXTRA_PAGES]) {
        await page.goto(`${site.origin}${path}`, { waitUntil: "load" });
        const found = await page.locator("body").evaluate(accentPaint);
        offenders.push(...found.map((line) => `${path}: ${line}`));
        bookActions += await page.locator("[data-primary-book]").count();
      }
      // The scan skips the Book action, so prove it was there to skip.
      assert(bookActions > 0, "no page rendered a [data-primary-book] action");
      assertEquals(
        offenders,
        [],
        `the accent is painted outside the Book action:\n${
          offenders.join("\n")
        }`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** A sample element per kind of link or control, with the states to check. */
const ACCENT_STATE_SAMPLES: {
  name: string;
  path: string;
  selector: string;
  states: ("hover" | "focus")[];
  /** Opens the phone More sheet first: its rows are drawn only inside it. */
  inSheet?: boolean;
}[] = [
  {
    name: "review attribution link",
    path: "/",
    selector: "[data-review-source] a",
    states: ["hover", "focus"],
  },
  {
    name: "tool page link",
    path: "/tools/mig",
    selector: 'main a[href^="https://github.com/"]',
    states: ["hover", "focus"],
  },
  {
    name: "tool card title",
    path: "/tools",
    selector: "main h3 a",
    states: ["hover", "focus"],
  },
  {
    name: "client work title",
    path: "/work",
    selector: "main h3 a",
    states: ["hover", "focus"],
  },
  {
    name: "post prose link",
    path: "/blog/ship-it-today",
    selector: ".blog-content p a",
    states: ["hover", "focus"],
  },
  {
    name: "brief form field",
    path: "/",
    selector: "form textarea",
    states: ["focus"],
  },
  {
    name: "newsletter field",
    path: "/blog",
    selector: 'input[type="email"]',
    states: ["focus"],
  },
  {
    name: "nav item",
    path: "/",
    selector: "nav a[data-nav-link]:visible",
    states: ["hover", "focus"],
  },
  {
    name: "nav portrait",
    path: "/blog",
    selector: '[data-e2e="rail-shell-top"] a[data-e2e="rail-shell-entry"]',
    states: ["hover", "focus"],
  },
  {
    name: "More sheet row",
    path: "/blog",
    selector: '[data-e2e="rail-shell-dialog"] a[data-e2e="rail-shell-entry"]',
    states: ["hover", "focus"],
    inSheet: true,
  },
  {
    name: "secondary button",
    path: "/",
    selector: "main a.rounded-lg\\!:not([data-primary-book])",
    states: ["hover", "focus"],
  },
];

Deno.test("a link, a form field and a secondary button show no accent while hovered or focused (#365)", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      const offenders: string[] = [];
      let path = "";
      for (const sample of ACCENT_STATE_SAMPLES) {
        if (sample.path !== path) {
          path = sample.path;
          await page.goto(`${site.origin}${path}`, {
            waitUntil: "networkidle",
          });
          // A colour transition would be read half-way; draw states at once.
          await page.addStyleTag({
            content: "*, *::before, *::after { transition: none !important; }",
          });
        }
        if (sample.inSheet) {
          // The sheet's More button is phone-only; open its dialog directly.
          await page.locator('[data-e2e="rail-shell-dialog"]').evaluate((el) =>
            (el as HTMLDialogElement).showModal()
          );
        }
        const target = page.locator(sample.selector).first();
        await target.waitFor({ state: "visible", timeout: WAIT_MS });
        for (const state of sample.states) {
          if (state === "hover") {
            await target.hover();
          } else {
            // Tab away and back, so the focus is a keyboard focus and
            // `:focus-visible` rules apply to links and buttons too.
            await target.focus();
            await page.keyboard.press("Tab");
            await page.keyboard.press("Shift+Tab");
          }
          const pseudo = state === "hover" ? ":hover" : ":focus-visible";
          assert(
            await target.evaluate((el, p) => el.matches(p), pseudo),
            `${sample.name} on ${path} is not in its ${state} state`,
          );
          const found = await target.evaluate(accentPaint);
          offenders.push(
            ...found.map((line) =>
              `${sample.name}, ${state}, ${path}: ${line}`
            ),
          );
          await page.mouse.move(0, 0);
        }
      }
      assertEquals(offenders, [], offenders.join("\n"));
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** Every `.ts`/`.tsx` file under a directory that is not a test. */
async function sourceFiles(dir: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const url = new URL(entry.name + (entry.isDirectory ? "/" : ""), dir);
    if (entry.isDirectory) files.push(...await sourceFiles(url));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      files.push(url);
    }
  }
  return files;
}

Deno.test("no class in routes, components or islands uses the accent except as a background (#365)", async () => {
  const offenders: string[] = [];
  let scanned = 0;
  for (const dir of ["routes/", "components/", "islands/"]) {
    for (
      const file of await sourceFiles(new URL(`../${dir}`, import.meta.url))
    ) {
      scanned++;
      const text = await Deno.readTextFile(file);
      // A Tailwind class, with any variants, whose colour is an accent token.
      const classes = text.matchAll(
        /(?<=^|[\s"'`])(?:[\w\-\[\]&>*]+:)*([a-z]+)-accent(?:-hover|-foreground|-\d+)?(?:\/\d+)?(?=$|[\s"'`])/gm,
      );
      for (const match of classes) {
        if (match[1] === "bg") continue;
        offenders.push(
          `${file.pathname.split(`/${dir}`)[1]} in ${dir}: ${match[0]}`,
        );
      }
    }
  }
  assert(scanned > 50, `only ${scanned} source files were scanned`);
  assertEquals(offenders, [], offenders.join("\n"));
});
