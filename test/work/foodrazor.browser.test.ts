// /work/foodrazor (#523) in a browser: axe and no sideways scroll at 390 and
// 1440px; the video asks YouTube for nothing until it is pressed, then plays
// in the nocookie player the CSP allows; the device switch swaps the
// walkthrough and sends case-try. Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { AxeBuilder } from "@axe-core/playwright"
import type { Browser, Page } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, recordUmami, trackedCalls } from "../browser.ts"

// @axe-core/playwright types its page with its own playwright-core.
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]["page"]

const PATH = "/work/foodrazor"
const YOUTUBE =
  /^https:\/\/([a-z0-9-]+\.)*(youtube|youtube-nocookie|ytimg|googlevideo)\.com\//

/**
 * Answers every request to a YouTube host with a blank page and returns the
 * list of what was asked, so the test needs no network and can tell whether
 * YouTube was contacted.
 */
async function stubYouTube(page: Page): Promise<string[]> {
  const asked: string[] = []
  await page.route(YOUTUBE, (route) => {
    asked.push(route.request().url())
    return route.fulfill({
      contentType: "text/html",
      body:
        "<!doctype html><html lang='en'><title>Player</title><main><h1>Player</h1></main>",
    })
  })
  return asked
}

Deno.test("/work/foodrazor has no axe violations and no sideways scroll at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const found: string[] = []
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      })
      try {
        const page = await context.newPage()
        await stubYouTube(page)
        await page.goto(site.origin + PATH, { waitUntil: "load" })
        const wide = await page.evaluate(() =>
          document.documentElement.scrollWidth - innerWidth
        )
        if (wide > 0) found.push(`${width}px: ${wide}px of sideways scroll`)
        const { violations } = await new AxeBuilder({
          page: page as unknown as AxePage,
        }).withTags(["wcag2a", "wcag2aa"]).analyze()
        for (const v of violations) {
          found.push(`${width}px: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`)
        }
      } finally {
        await context.close()
      }
    }
    assertEquals(found, [])
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("the FoodRazor video asks YouTube for nothing until pressed, then plays in the nocookie player with focus inside it", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    try {
      const page = await context.newPage()
      await recordUmami(page)
      const asked = await stubYouTube(page)
      const blocked: string[] = []
      page.on("console", (m) => {
        if (/Content Security Policy/i.test(m.text())) blocked.push(m.text())
      })
      await page.goto(site.origin + PATH, { waitUntil: "networkidle" })
      assertEquals(asked, [], "asked YouTube before the press")
      const play = page.getByRole("link", {
        name: "Play video: FoodRazor video overview",
      })
      await play.focus()
      await page.keyboard.press("Enter")
      const player = page.locator(
        'iframe[src="https://www.youtube-nocookie.com/embed/IL3M0A7g0SE?autoplay=1"]',
      )
      await player.waitFor()
      await page.waitForFunction(() =>
        document.activeElement?.tagName === "IFRAME"
      )
      assertEquals(
        await player.getAttribute("title"),
        "FoodRazor video overview",
      )
      assert(
        asked.some((u) => u.startsWith("https://www.youtube-nocookie.com/")),
        `the player was not loaded: ${asked.join(", ")}`,
      )
      assertEquals(blocked, [])
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "demo-play"),
        [["demo-play", { item: "foodrazor", place: "hero" }]],
      )
    } finally {
      await context.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("the device switch shows the desktop walkthrough, loads its screens only then, and sends case-try once per device", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    try {
      const page = await context.newPage()
      await recordUmami(page)
      await stubYouTube(page)
      const desktopShots: string[] = []
      page.on("request", (r) => {
        if (/\/img\/projects\/foodrazor\/(1|3)\.webp/.test(r.url())) {
          desktopShots.push(r.url())
        }
      })
      await page.goto(site.origin + PATH, { waitUntil: "networkidle" })
      assertEquals(desktopShots, [], "desktop screens loaded before the pick")
      // The radios are visually hidden inside their chips: press the chip.
      const desktop = page.locator("label:has(#foodrazor-device-desktop)")
      const phone = page.locator("label:has(#foodrazor-device-phone)")
      await desktop.click()
      const tabs = page.getByRole("tablist", {
        name: "From a paper invoice to a price alert, desktop",
      }).getByRole("tab")
      const names = (await tabs.allInnerTexts()).map((t) =>
        t.replace(/\s+/g, " ").trim()
      )
      assertEquals(names, [
        "1 Digitize paper invoices",
        "2 Tracking price fluctuations",
      ])
      await page.locator('img[src*="/img/projects/foodrazor/3.webp"]').waitFor()
      assert(
        (await page.locator("main").innerText()).includes(
          "Automating orders to suppliers: no desktop screenshot.",
        ),
      )
      await phone.click()
      await desktop.click()
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "case-try"),
        [
          ["case-try", { item: "foodrazor", part: "device", step: "desktop" }],
          ["case-try", { item: "foodrazor", part: "device", step: "phone" }],
        ],
      )
    } finally {
      await context.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
