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
import type { Browser, Locator, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

const MOBILE_VIEWPORT = { width: 390, height: 844 };

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
        'button:has(img[alt="CallTrack screenshot 1"])',
      );
      const secondThumb = page.locator(
        'button:has(img[alt="CallTrack screenshot 2"])',
      );

      // Open, check the dialog's accessible name, and that Close, Previous
      // and Next each have a real accessible name (not just the aria-hidden
      // icon inside them).
      await firstThumb.click();
      const dialog = page.getByRole("dialog", {
        name: "CallTrack screenshot 1",
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
      await page.getByRole("dialog", { name: "CallTrack screenshot 2" })
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
        name: "CallTrack screenshot 2",
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
