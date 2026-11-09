// Browser guards for the home page's first screen (#529, #615): both actions
// sit above the fold on a 390x844 phone, above the sticky tab bar, the H1 is
// the phone's largest paint, from 1024px the video takes the right column
// beside the H1, and the video asks YouTube for nothing until it is pressed.
// Axe and horizontal scroll on / are in test/a11y.browser.test.ts. Runs under
// `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "./harness.ts"
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "./browser.ts"
import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts"
import { HOME_VIDEO_ID } from "../lib/home.ts"

/** RFC 2606 host, so Book renders. */
const SCHEDULE_URL = "https://meet.example.com/book"

/** The bottom edge of what a visitor sees first: the top of the tab bar on a phone. */
function foldOf(page: Page): Promise<number> {
  return page.evaluate(() => {
    const dock = document.querySelector('[data-e2e="rail-shell-dock"]')
    const top = dock?.getBoundingClientRect().top ?? innerHeight
    return Math.min(top, innerHeight)
  })
}

for (
  const [label, scheduleUrl, actions] of [
    ["with a calendar", SCHEDULE_URL, [BOOK_LABEL, BRIEF_LABEL]],
    ["without a calendar", "", [BRIEF_LABEL]],
  ] as const
) {
  Deno.test(`the home actions are above the fold at 390x844 ${label}`, async () => {
    const site = await startSite({ env: { SCHEDULE_URL: scheduleUrl } })
    let browser: Browser | undefined
    try {
      browser = await launchChromium()
      const page = await newPage(browser, {
        viewport: { width: 390, height: 844 },
      })
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" })
      const fold = await foldOf(page)
      const hero = page.locator('[data-home-section="hero"]')
      for (const name of actions) {
        const box = await hero.getByRole("link", { name, exact: true })
          .boundingBox()
        assert(box, `no "${name}" in the hero`)
        assert(
          box.y >= 0 && box.y + box.height <= fold,
          `"${name}" ends at ${box.y + box.height}px, fold at ${fold}px`,
        )
      }
    } finally {
      await browser?.close()
      await site.stop()
    }
  })
}

Deno.test("the H1 is the largest paint of the home page's first screen at 390x844", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    await page.goto(`${site.origin}/`, { waitUntil: "networkidle" })
    const lcp = await page.evaluate(() =>
      new Promise<string>((resolve) => {
        new PerformanceObserver((list) => {
          const el = list.getEntries().at(-1) as
            | (PerformanceEntry & { element: Element | null })
            | undefined
          resolve(
            el?.element?.closest("h1")
              ? "h1"
              : el?.element?.outerHTML.slice(0, 120) ?? "none",
          )
        }).observe({ type: "largest-contentful-paint", buffered: true })
      })
    )
    assertEquals(lcp, "h1")
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("the home video takes the right column at 1440px, level with the H1, with both actions on the first screen", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${site.origin}/`, { waitUntil: "networkidle" })
    const { h1, video } = await page.evaluate(() => {
      const box = (el: Element) => {
        const r = el.getBoundingClientRect()
        return { top: r.top, left: r.left, right: r.right, width: r.width }
      }
      return {
        h1: box(document.querySelector("h1")!),
        video: box(document.querySelector("[data-home-video-play]")!),
      }
    })
    assert(
      video.left >= h1.right,
      `video ${JSON.stringify(video)}, h1 ${JSON.stringify(h1)}`,
    )
    assert(
      Math.abs(video.top - h1.top) < 16,
      `video top ${video.top}, h1 top ${h1.top}`,
    )
    assertEquals(Math.round(video.width), 300)
    const hero = page.locator('[data-home-section="hero"]')
    for (const name of [BOOK_LABEL, BRIEF_LABEL]) {
      const box = await hero.getByRole("link", { name, exact: true })
        .boundingBox()
      assert(box && box.y + box.height <= 900, `"${name}" is below the fold`)
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

for (
  const [width, press] of [[390, "click"], [1440, "Enter"]] as const
) {
  Deno.test(`the home video plays in place from youtube-nocookie on ${press} at ${width}px, takes focus and sends one video event, with no YouTube request before`, async () => {
    const site = await startSite({ env: { SCHEDULE_URL } })
    let browser: Browser | undefined
    try {
      browser = await launchChromium()
      const page = await newPage(browser, {
        viewport: { width, height: 900 },
      })
      await recordUmami(page)
      // The test runs offline: every YouTube request is counted and refused.
      const youtube: string[] = []
      await page.route(/youtube/, (route) => {
        youtube.push(route.request().url())
        return route.abort()
      })
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" })
      assertEquals(youtube, [], "YouTube was asked before the press")
      const play = page.locator("[data-home-video-play]")
      if (press === "click") await play.click({ timeout: WAIT_MS })
      else {
        await play.focus()
        await page.keyboard.press("Enter")
      }
      const player = page.locator("[data-home-video] iframe")
      await player.waitFor({ timeout: WAIT_MS })
      assertEquals(
        await player.getAttribute("src"),
        `https://www.youtube-nocookie.com/embed/${HOME_VIDEO_ID}?autoplay=1&playsinline=1`,
      )
      assertEquals(page.url(), `${site.origin}/`, "the press left the page")
      await page.waitForFunction(
        () => document.activeElement?.tagName === "IFRAME",
        null,
        { timeout: WAIT_MS },
      )
      const box = await player.boundingBox()
      assert(
        box && Math.abs(box.height / box.width - 16 / 9) < 0.02,
        `not 9:16: ${JSON.stringify(box)}`,
      )
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "video"),
        [["video", { place: "hero" }]],
      )
      assert(
        await page.getByRole("link", { name: /Watch on YouTube/ }).isVisible(),
        "no Watch on YouTube link under the player",
      )
    } finally {
      await browser?.close()
      await site.stop()
    }
  })
}
