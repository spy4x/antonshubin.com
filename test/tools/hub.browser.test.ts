// The curated /tools hub (#456) in a browser: axe, no sideways scroll and one
// <h1> at 390 and 1440px with the archive closed and open; Seed's play button
// on the first screen at both widths; a card's clip and the spotlight's play
// from the keyboard, loop and send demo-play without fetching any video before
// the press; starting a second clip pauses the first where it was. Needs a
// built site and Chromium; see docs/testing.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "../browser.ts"
import { axeViolations, toolPageProblems } from "../tool-frame.ts"

Deno.test("the hub has no axe violation, sideways scroll or extra h1, with the archive closed or open", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      const problems = await toolPageProblems(page, site.origin, "/tools")
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" })
        await page.getByText("Archived (2)", { exact: true }).click()
        const at = `/tools at ${width}px, archive open`
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
        if (overflow > 0) {
          problems.push(`${at}: scrolls sideways by ${overflow}px`)
        }
        for (const v of await axeViolations(page)) problems.push(`${at}: ${v}`)
      }
      assertEquals(problems, [])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Seed's play button is on the hub's first screen at 390 and 1440px", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (
      const viewport of [{ width: 390, height: 844 }, {
        width: 1440,
        height: 900,
      }]
    ) {
      const page = await newPage(browser, { viewport })
      try {
        await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" })
        const play = page.locator(
          '[data-hub-spotlight] a[aria-label^="Play video"]',
        )
        const box = await play.boundingBox()
        assert(box, `${viewport.width}px: no play link in the spotlight`)
        // The play mark sits at the poster's centre, so the centre must show.
        assert(
          box.y + box.height / 2 < viewport.height,
          `${viewport.width}px: Seed's play button is below the first screen`,
        )
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("a hub card's clip and the spotlight's play from the keyboard in a loop, send demo-play, and no video loads before", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
    })
    try {
      const videos: string[] = []
      page.on("request", (r) => {
        if (r.url().includes("/demo.")) videos.push(r.url())
      })
      await recordUmami(page)
      await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" })
      await page.evaluate(() =>
        globalThis.scrollTo(0, document.body.scrollHeight)
      )
      await page.waitForLoadState("networkidle")
      assertEquals(videos, [], "a clip loaded before any press")
      const play = page.locator(
        'li[data-tool="mig"] a[aria-label^="Play video"]',
      )
      await play.focus()
      await page.keyboard.press("Enter")
      const video = page.locator('li[data-tool="mig"] video')
      await video.waitFor({ timeout: WAIT_MS })
      assert(
        await video.evaluate((v) => (v as HTMLVideoElement).loop),
        "not looping",
      )
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "demo-play"),
        [["demo-play", { item: "mig", place: "card" }]],
      )
      assertEquals(
        await page.locator("[data-hub-spotlight] video").count(),
        0,
        "pressing one clip played another",
      )
      const spotlight = page.locator(
        '[data-hub-spotlight] a[aria-label^="Play video"]',
      )
      await spotlight.focus()
      await page.keyboard.press("Enter")
      const seed = page.locator("[data-hub-spotlight] video")
      await seed.waitFor({ timeout: WAIT_MS })
      assert(
        await seed.evaluate((v) => (v as HTMLVideoElement).loop),
        "the spotlight clip does not loop",
      )
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "demo-play")
          .at(-1),
        ["demo-play", { item: "seed", place: "hero" }],
      )
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("starting a second clip on the hub pauses the first where it was", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await page.goto(`${site.origin}/tools`, { waitUntil: "networkidle" })
      await page.locator('li[data-tool="mig"] a[aria-label^="Play video"]')
        .click()
      const mig = page.locator('li[data-tool="mig"] video')
      await mig.waitFor({ timeout: WAIT_MS })
      await page.waitForFunction(
        () => {
          const v = document.querySelector<HTMLVideoElement>(
            'li[data-tool="mig"] video',
          )
          return v !== null && !v.paused && v.currentTime > 1
        },
        null,
        { timeout: WAIT_MS },
      )
      await page.locator('[data-hub-spotlight] a[aria-label^="Play video"]')
        .click()
      await page.waitForFunction(
        () => {
          const v = document.querySelector<HTMLVideoElement>(
            "[data-hub-spotlight] video",
          )
          return v !== null && !v.paused && v.currentTime > 0.5
        },
        null,
        { timeout: WAIT_MS },
      )
      const first = await mig.evaluate((v) => {
        const video = v as HTMLVideoElement
        return { paused: video.paused, at: video.currentTime }
      })
      assert(first.paused, "the first clip still plays beside the second")
      assert(first.at > 1, `the first clip went back to ${first.at}s`)
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
