// Browser-driven guards for issue #165: the mobile menu's Escape handling
// (islands/Menu.tsx) and the two photo lightboxes' names and focus return
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

Deno.test("Escape closes the mobile menu and returns focus to the toggle button", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page: Page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });

      const toggle = page.getByRole("button", { name: "Open main menu" });
      await toggle.click();

      const menu = page.locator("#mobile-menu");
      await menu.waitFor({ state: "visible" });
      await toggle.waitFor({ state: "hidden" }); // renamed to "Close main menu"
      const closeToggle = page.getByRole("button", {
        name: "Close main menu",
      });
      await closeToggle.waitFor({ state: "visible" });
      assertEquals(
        await closeToggle.getAttribute("aria-expanded"),
        "true",
        "the toggle button must report the menu as expanded while it is open",
      );

      // Move focus into the menu before closing it, so the focus assertion
      // below actually proves Escape moves focus back to the toggle button
      // rather than merely leaving it where the earlier click put it.
      await menu.getByRole("link", { name: "Work", exact: true }).focus();
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });

      const reopenToggle = page.getByRole("button", {
        name: "Open main menu",
      });
      await reopenToggle.waitFor({ state: "visible" });
      assertEquals(
        await reopenToggle.getAttribute("aria-expanded"),
        "false",
        "the toggle button must report the menu as collapsed after Escape",
      );
      assert(
        await isFocused(reopenToggle),
        "focus must land on the menu toggle button after Escape closes the menu",
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
      // Escape, not just while open, would steal focus to the toggle button
      // even though there is nothing open to close.
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
