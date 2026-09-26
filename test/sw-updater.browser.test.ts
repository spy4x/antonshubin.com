// Browser-driven guard for islands/SWUpdater.tsx's reload (#259). It used to
// reload the page on every `controllerchange`, and on a first visit the
// service worker taking control for the first time fires one too: the page
// reloaded by itself a second after it opened, and a booking frame opened on
// /contact-me in that second was gone. The first test is that first visit, with
// service workers allowed. The second pins the reload the island exists for:
// the "New version available" button still reloads onto the new worker.
//
// Runs under `deno task test:browser` (its own -A task) — see AGENTS.md
// "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

const CONTROL_WAIT_MS = 10_000;
/** How long to keep watching after the worker took control. The reload the
 * bug made followed the takeover within milliseconds. */
const SETTLE_MS = 2_000;

/** Waits until a service worker controls whatever document the page holds.
 * A reload in between destroys the evaluation context, so a failed
 * evaluation is retried instead of failing the wait. */
async function waitUntilControlled(page: Page): Promise<void> {
  const deadline = Date.now() + CONTROL_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      if (
        await page.evaluate(() => navigator.serviceWorker.controller !== null)
      ) return;
    } catch {
      // The page is between documents; ask again.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `no service worker took control within ${CONTROL_WAIT_MS} ms`,
  );
}

Deno.test("a first visit is never reloaded when the service worker takes control", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    // Service workers allowed: test/browser.ts's newPage() blocks them.
    const context = await browser.newContext();
    const page = await context.newPage();
    let loads = 0;
    page.on("load", () => loads++);

    await page.goto(`${site.origin}/contact-me`, { waitUntil: "load" });
    assertEquals(
      await page.evaluate(() => navigator.serviceWorker.controller),
      null,
      "the page must start uncontrolled, or this is not a first visit",
    );
    // Stands in for anything the visitor opens on the page, such as the
    // booking frame: a reload wipes it.
    await page.evaluate(() => {
      (globalThis as unknown as { visitorState: string }).visitorState = "kept";
    });

    await waitUntilControlled(page);
    await page.waitForTimeout(SETTLE_MS);

    assertEquals(
      loads,
      1,
      "the page reloaded after the service worker took control",
    );
    assertEquals(
      await page.evaluate(() =>
        (globalThis as unknown as { visitorState?: string }).visitorState
      ),
      "kept",
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the update button still reloads the page onto the new service worker", async () => {
  let site = await startSite({ env: { BUILD_ID: "first-deploy" } });
  const port = Number(new URL(site.origin).port);
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const context = await browser.newContext();
    const page = await context.newPage();
    let loads = 0;
    page.on("load", () => loads++);

    await page.goto(`${site.origin}/contact-me`, { waitUntil: "load" });
    await waitUntilControlled(page);
    assertEquals(
      loads,
      1,
      "the first visit reloaded, so the update below proves nothing",
    );

    // A deploy: same origin, new build id, so /sw.js changes and the
    // browser's update check installs a new worker next to the active one.
    await site.stop();
    site = await startSite({ env: { BUILD_ID: "second-deploy" }, port });
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    const button = page.getByRole("button", { name: "Reload" });
    await button.waitFor({ state: "visible", timeout: CONTROL_WAIT_MS });

    const reloaded = page.waitForEvent("load", { timeout: CONTROL_WAIT_MS });
    await button.click();
    await reloaded;

    assertEquals(
      loads,
      2,
      "clicking the update button did not reload the page",
    );
    // The new worker's activation deletes every cache but its own, the
    // one named after its build id.
    const deadline = Date.now() + CONTROL_WAIT_MS;
    let cacheNames: string[] = [];
    while (Date.now() < deadline) {
      cacheNames = await page.evaluate(() => caches.keys());
      if (cacheNames.join() === "antonshubin-second-deploy") break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assertEquals(
      cacheNames,
      ["antonshubin-second-deploy"],
      "the old worker's cache is still there",
    );
    assertEquals(
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.waiting ?? null;
      }),
      null,
      "after the reload the new worker is still waiting, so the page is not on it",
    );
  } finally {
    await browser?.close();
    await site.stop();
  }
});
