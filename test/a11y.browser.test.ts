// Browser-driven guards for issue #165: the mobile menu's Escape handling
// (islands/NavMore.tsx; #185 made it the More dialog and added the rail's tab
// order and the phone tab bar) and the two photo lightboxes' names and focus return
// (islands/ImageGallery.tsx on a project page, islands/BlogImageEnhancer.tsx
// on a blog post). None of this is visible in the server-rendered HTML the
// other rendered-page tests read — the lightbox only gets its aria-label
// once client JS opens it, and the mobile menu's Escape handling is a
// keydown listener that never runs without a real browser — so it needs
// hydrated JS and real keyboard/focus events, same as
// test/lead-form.browser.test.ts.
//
// Runs under `deno task test:browser`, with the same -A permission set as
// that file — see AGENTS.md "Rendered-page tests" for why browser-driven
// tests are excluded from the plain `deno task test` glob instead of
// widening that task's permissions. Chromium launch/version handling is
// shared with that file via test/browser.ts.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import axeCore from "axe-core";
import type { Browser, Locator, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

/** The six project pages #246 was designed and reviewed against. */
const SAMPLE_PROJECTS = [
  "smartlite",
  "foodrazor",
  "corecircle",
  "roley",
  "microwork",
  "code-review",
];

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation on the loaded page. */
async function axeViolations(page: Page): Promise<string[]> {
  // Injected through page.evaluate, not a <script> tag, so the site's CSP
  // does not block it (see test/contrast.browser.test.ts).
  await page.evaluate(axeCore.source);
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }) as { violations: { id: string; nodes: { html: string }[] }[] };
  return results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
  );
}

/** True if `locator`'s element is the page's current `document.activeElement`. */
function isFocused(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => el === document.activeElement);
}

Deno.test("project gallery lightbox is named, its buttons are named, and focus returns", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage();
    try {
      await page.goto(`${site.origin}/projects/calltrack`, {
        waitUntil: "networkidle",
      });

      const firstThumb = page.locator(
        'button:has(img[alt="Screenshot 1 of 7"])',
      );
      const secondThumb = page.locator(
        'button:has(img[alt="Screenshot 2 of 7"])',
      );

      // Open, check the dialog's accessible name, and that Close, Previous
      // and Next each have a real accessible name (not just the aria-hidden
      // icon inside them).
      await firstThumb.click();
      const dialog = page.getByRole("dialog", {
        name: "Screenshot 1 of 7",
      });
      await dialog.waitFor({ state: "visible" });

      const closeButton = dialog.getByRole("button", { name: "Close" });
      const nextButton = dialog.getByRole("button", { name: "Next image" });
      const prevButton = dialog.getByRole("button", {
        name: "Previous image",
      });
      await closeButton.waitFor({ state: "visible" });
      await nextButton.waitFor({ state: "visible" });
      await prevButton.waitFor({ state: "visible" });

      // Next moves to the next image and renames the dialog.
      await nextButton.click();
      await page.getByRole("dialog", { name: "Screenshot 2 of 7" })
        .waitFor({ state: "visible" });

      // Escape closes the dialog and returns focus to the thumbnail that
      // opened it (the first one — Next only changed which image shows,
      // not which button opened the lightbox).
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert(
        await isFocused(firstThumb),
        "focus must return to the thumbnail that opened the lightbox after Escape",
      );

      // Close button does the same, from a different trigger.
      await secondThumb.click();
      const dialog2 = page.getByRole("dialog", {
        name: "Screenshot 2 of 7",
      });
      await dialog2.waitFor({ state: "visible" });
      await dialog2.getByRole("button", { name: "Close" }).click();
      await dialog2.waitFor({ state: "hidden" });
      assert(
        await isFocused(secondThumb),
        "focus must return to the thumbnail that opened the lightbox after Close",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the project gallery counts its screenshots and its named Next and Previous buttons move the strip", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
    try {
      await page.goto(`${site.origin}/projects/smartlite`, {
        waitUntil: "networkidle",
      });
      const counter = page.locator("[data-gallery-counter]");
      assertEquals((await counter.innerText()).trim(), "1 / 12");
      const next = page.getByRole("button", { name: "Next screenshot" });
      const prev = page.getByRole("button", { name: "Previous screenshot" });
      await next.waitFor({ state: "visible" });
      await prev.waitFor({ state: "visible" });

      await next.click();
      await page.waitForFunction(() =>
        document.querySelector("[data-gallery-counter]")?.textContent
          ?.trim() === "2 / 12"
      );
      const scrolled = await page.locator("[data-gallery-strip]").evaluate(
        (el) => el.scrollLeft,
      );
      assert(scrolled > 0, "Next did not scroll the strip");

      await prev.click();
      await page.waitForFunction(() =>
        document.querySelector("[data-gallery-counter]")?.textContent
          ?.trim() === "1 / 12"
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** The gallery counter's text, e.g. "3 / 9". */
async function counterText(page: Page): Promise<string> {
  return (await page.locator("[data-gallery-counter]").innerText()).trim();
}

/**
 * Clicks `button` until it is disabled (at most `limit` clicks), waiting
 * after each click for the strip's smooth scroll to end, and returns every
 * counter value seen, starting with the one before the first click. Fails
 * when a click does not scroll the strip at all.
 */
async function walk(page: Page, button: Locator, limit: number) {
  const strip = page.locator("[data-gallery-strip]");
  const seen = [await counterText(page)];
  for (let i = 0; i < limit && await button.isEnabled(); i++) {
    const scrolled = strip.evaluate((el) =>
      new Promise<boolean>((resolve) => {
        el.addEventListener("scrollend", () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 5000);
      })
    );
    await button.click();
    assert(await scrolled, `click ${i + 1} did not scroll the strip`);
    seen.push(await counterText(page));
  }
  return seen;
}

Deno.test("a portrait gallery's Next walks to the last screenshot and Previous walks back", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
    try {
      // Roley: nine phone screenshots, several in view at once at 1440px.
      await page.goto(`${site.origin}/projects/roley`, {
        waitUntil: "networkidle",
      });
      const next = page.getByRole("button", { name: "Next screenshot" });
      const prev = page.getByRole("button", { name: "Previous screenshot" });
      await next.waitFor({ state: "visible" });
      assert(await prev.isDisabled(), "Previous is enabled at the start");

      const forward = await walk(page, next, 9);
      assertEquals(forward[0], "1 / 9");
      assertEquals(forward[forward.length - 1], "9 / 9", forward.join(", "));
      assert(await next.isDisabled(), "Next is still enabled at the end");

      const back = await walk(page, prev, 9);
      assertEquals(back[back.length - 1], "1 / 9", back.join(", "));
      assert(await prev.isDisabled(), "Previous is still enabled at the start");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a gallery that fits without scrolling offers no Next or Previous", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
    try {
      // Connectful: three phone screenshots, all in view at 1440px.
      await page.goto(`${site.origin}/projects/connectful`, {
        waitUntil: "networkidle",
      });
      const overflow = await page.locator("[data-gallery-strip]").evaluate(
        (el) => el.scrollWidth - el.clientWidth,
      );
      assert(overflow <= 1, `the strip still scrolls by ${overflow}px`);
      for (const name of ["Next screenshot", "Previous screenshot"]) {
        assertEquals(
          await page.getByRole("button", { name }).count(),
          0,
          `${name} is offered with nothing to scroll`,
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

Deno.test("the six sample project pages have no horizontal scroll and no axe violations at 390 and 1440px", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  // The Book buttons render only with a booking URL; RFC 2606 host.
  Deno.env.set("SCHEDULE_URL", "https://meet.example.com/book");
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    for (const viewport of [MOBILE_VIEWPORT, DESKTOP_VIEWPORT]) {
      const page: Page = await browser.newPage({ viewport });
      try {
        for (const slug of SAMPLE_PROJECTS) {
          const where = `/projects/${slug} at ${viewport.width}px`;
          await page.goto(`${site.origin}/projects/${slug}`, {
            waitUntil: "networkidle",
          });
          const scrollWidth = await page.evaluate(() =>
            document.documentElement.scrollWidth
          );
          assert(
            scrollWidth <= viewport.width,
            `${where} scrolls sideways: ${scrollWidth}px wide`,
          );
          assertEquals(await axeViolations(page), [], where);
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("blog image lightbox is named, its Close button is named, and focus returns", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage();
    try {
      await page.goto(
        `${site.origin}/blog/from-office-job-to-freelance-to-my-startups`,
        { waitUntil: "networkidle" },
      );

      const trigger = page.getByRole("button", {
        name: "View larger image: Young developer",
      });
      await trigger.click();

      const dialog = page.getByRole("dialog", { name: "Young developer" });
      await dialog.waitFor({ state: "visible" });
      const closeButton = dialog.getByRole("button", { name: "Close" });
      await closeButton.waitFor({ state: "visible" });

      // This lightbox has one image per post — no Previous/Next controls.
      assertEquals(
        await dialog.getByRole("button", { name: "Next image" }).count(),
        0,
        "the single-image blog lightbox must not have a Next button",
      );
      assertEquals(
        await dialog.getByRole("button", { name: "Previous image" }).count(),
        0,
        "the single-image blog lightbox must not have a Previous button",
      );

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert(
        await isFocused(trigger),
        "focus must return to the image that opened the lightbox after Escape",
      );

      await trigger.click();
      await dialog.waitFor({ state: "visible" });
      await dialog.getByRole("button", { name: "Close" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert(
        await isFocused(trigger),
        "focus must return to the image that opened the lightbox after Close",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("More opens the menu dialog, Escape closes it and focus returns to More", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

      const more = page.getByRole("button", { name: "More", exact: true });
      await more.click();

      const menu = page.locator("#mobile-menu");
      await page.getByRole("dialog", { name: "More" }).waitFor({
        state: "visible",
      });
      assertEquals(
        await more.getAttribute("aria-expanded"),
        "true",
        "More must report the menu as expanded while it is open",
      );

      // Move focus into the menu before closing it, so the focus assertion
      // below actually proves Escape moves focus back to More rather than
      // merely leaving it where the earlier click put it.
      const writing = menu.getByRole("link", { name: "Writing", exact: true });
      await writing.focus();
      assert(await isFocused(writing), "focus must be inside the open menu");
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
      // The dialog's `close` event, which resets More, is dispatched as a
      // separate task after the dialog hides.
      await page.locator('#tab-bar button[aria-expanded="false"]').waitFor({
        timeout: 2000,
      }).catch(() => {});

      assertEquals(
        await more.getAttribute("aria-expanded"),
        "false",
        "More must report the menu as collapsed after Escape",
      );
      assert(
        await isFocused(more),
        "focus must land on More after Escape closes the menu",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Tabbing through the desktop rail goes top to bottom with upright labels", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    try {
      await page.goto(`${site.origin}/blog`, { waitUntil: "networkidle" });

      // Tab from the top of the page until focus leaves the rail, recording
      // each rail stop's top edge and whether anything above it is
      // transformed (the old rail was the phone bar rotated -90deg).
      const stops: {
        label: string;
        y: number;
        transformed: boolean;
        writingMode: string;
        hasIcon: boolean;
      }[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el?.closest("#desktop-menu")) return null;
          let transformed = false;
          for (let n: Element | null = el; n; n = n.parentElement) {
            if (getComputedStyle(n).transform !== "none") transformed = true;
          }
          const label = el.querySelector("span");
          return {
            label: (el.textContent || "").replace(/\s+/g, " ").trim(),
            y: el.getBoundingClientRect().top,
            transformed,
            writingMode: label ? getComputedStyle(label).writingMode : "",
            hasIcon: el.querySelector("svg.nav-icon") !== null,
          };
        });
        if (!stop) {
          if (stops.length > 0) break;
          continue;
        }
        stops.push(stop);
      }

      assertEquals(
        stops.map((s) => s.label),
        [
          "Anton",
          "Write",
          "Work",
          "Services",
          "How I work",
          "Tools",
          "Writing",
          "Links",
        ],
        "the rail must be tabbed through in its visual order",
      );
      for (let i = 1; i < stops.length; i++) {
        assert(
          stops[i].y > stops[i - 1].y,
          `"${stops[i].label}" (y=${stops[i].y}) must sit below "${
            stops[i - 1].label
          }" (y=${stops[i - 1].y})`,
        );
      }
      for (const stop of stops) {
        assert(!stop.transformed, `"${stop.label}" is inside a transform`);
        assertEquals(
          stop.writingMode,
          "horizontal-tb",
          `"${stop.label}" must read horizontally`,
        );
        // The portrait is Anton's icon; every other stop draws a nav icon.
        if (stop.label !== "Anton") {
          assert(stop.hasIcon, `"${stop.label}" has no icon`);
        }
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the rail's Links popover lists the Links groups when opened", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    try {
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Links", exact: true }).click();
      const popover = page.locator("#nav-links");
      for (const name of ["GitHub", "RSS", "meet.antonshubin.com"]) {
        await popover.getByRole("link", { name, exact: false }).first()
          .waitFor({ state: "visible", timeout: 5000 });
      }
      await page.keyboard.press("Escape");
      await popover.waitFor({ state: "hidden" });
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

/** The computed colour a probe element gets from `className`, e.g. `bg-lamp`. */
function tokenColour(
  page: Page,
  className: string,
  property: "backgroundColor" | "borderTopColor",
): Promise<string> {
  return page.evaluate(([cls, prop]) => {
    const probe = document.createElement("div");
    probe.className = `${cls} border`;
    document.body.append(probe);
    const value = getComputedStyle(probe)[prop as "backgroundColor"];
    probe.remove();
    return value;
  }, [className, property]);
}

Deno.test("a 390px phone shows five tabs with Book in the centre and the current section marked", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      const tabs = page.locator("#tab-bar li > :is(a, button)");

      /** Loads `path` and waits until the More island has hydrated (More
       * only opens its dialog once client JS runs), so the state checks
       * below see the page after hydration, not only the server HTML. */
      const load = async (path: string) => {
        await page.goto(`${site.origin}${path}`, { waitUntil: "networkidle" });
        await tabs.nth(4).click();
        await page.locator("#mobile-menu").waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        await page.locator("#mobile-menu").waitFor({ state: "hidden" });
      };

      await load("/catalog");
      assertEquals(
        (await tabs.allInnerTexts()).map((t) => t.trim()),
        ["Work", "Services", "Write", "Tools", "More"],
      );
      for (let i = 0; i < 5; i++) {
        const box = await tabs.nth(i).boundingBox();
        assert(box, `tab ${i} has no box`);
        assert(
          box.x >= 0 && box.x + box.width <= MOBILE_VIEWPORT.width &&
            box.y >= 0 && box.y + box.height <= MOBILE_VIEWPORT.height,
          `tab ${i} must sit inside the 390px viewport: ${JSON.stringify(box)}`,
        );
      }
      const book = await tabs.nth(2).boundingBox();
      assert(book);
      assert(
        Math.abs(book.x + book.width / 2 - MOBILE_VIEWPORT.width / 2) < 2,
        `Book must be centred: ${JSON.stringify(book)}`,
      );

      // The current page: a Lamp pill.
      const services = tabs.nth(1);
      assertEquals(await services.getAttribute("aria-current"), "page");
      assertEquals(
        await services.evaluate((el) => getComputedStyle(el).backgroundColor),
        await tokenColour(page, "bg-lamp", "backgroundColor"),
        "the current page's tab must be a Lamp pill",
      );

      // A page inside the section: an outlined pill.
      await load("/catalog/zero-to-production-saas-mvp");
      assertEquals(await services.getAttribute("aria-current"), "true");
      assertEquals(
        await services.evaluate((el) => getComputedStyle(el).borderTopColor),
        await tokenColour(page, "border-rule-strong", "borderTopColor"),
        "the current section's tab must be an outlined pill",
      );

      // A page listed under More: More itself is outlined, and inside the
      // dialog the page's own link is marked current.
      await load("/blog");
      const more = tabs.nth(4);
      assertEquals(
        await more.getAttribute("data-section-current"),
        "true",
        "More must be marked when the current page is one of its items",
      );
      assertEquals(
        await more.evaluate((el) => getComputedStyle(el).borderTopColor),
        await tokenColour(page, "border-rule-strong", "borderTopColor"),
        "More must be an outlined pill on a page listed under it",
      );
      await more.click();
      const menu = page.locator("#mobile-menu");
      await menu.waitFor({ state: "visible" });
      assertEquals(
        await menu.getByRole("link", { name: "Writing", exact: true })
          .getAttribute("aria-current"),
        "page",
        "the More dialog must mark the current page's link",
      );

      // A tap on the backdrop, above the sheet, closes it and returns focus.
      await page.mouse.click(MOBILE_VIEWPORT.width / 2, 10);
      await menu.waitFor({ state: "hidden" });
      assert(
        await more.evaluate((el) => el === document.activeElement),
        "focus must return to More after a tap outside the dialog",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("Escape leaves focus alone when the mobile menu is already closed", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

      // The menu is closed from the start — focus a link outside it, in
      // <main>, and press Escape. A menu handler that closes on every
      // Escape, not just while open, would steal focus to More even though
      // there is nothing open to close.
      const mainLink = page.locator("#main-content").getByRole("link", {
        name: "See all work",
      });
      await mainLink.focus();
      await page.keyboard.press("Escape");

      assert(
        await isFocused(mainLink),
        "focus must stay on the link when Escape is pressed with the menu already closed",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
