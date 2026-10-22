// #523: /work/corecircle in a browser: axe and no sideways scroll at 390 and
// 1440px, and the tour of the four screens from the keyboard with its
// case-try events. Needs a built site and Chromium; see docs/testing.md
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
import { casePageProblems, SCHEDULE } from "./browser.ts"

Deno.test("/work/corecircle has no axe violation and no sideways scroll at 390 and 1440px", async () => {
  assertEquals(await casePageProblems("/work/corecircle"), [])
})

Deno.test("Corecircle's screens move with the arrow keys, Home and End, and send case-try once per screen", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, { viewport: { width, height: 900 } })
      try {
        await recordUmami(page)
        await page.goto(`${site.origin}/work/corecircle`, {
          waitUntil: "networkidle",
        })
        const tabs = page.getByRole("tablist", { name: "Corecircle screens" })
          .getByRole("tab")
        const selected = () =>
          page.getByRole("tab", { selected: true }).innerText()
        await tabs.first().focus({ timeout: WAIT_MS })
        await page.keyboard.press("ArrowRight")
        assertEquals(await selected(), "Screen 2")
        assert(
          await tabs.nth(1).evaluate((el) => el === document.activeElement),
          "focus did not follow",
        )
        await page.keyboard.press("End")
        assertEquals(await selected(), "Screen 4")
        await page.keyboard.press("Home")
        assertEquals(await selected(), "Screen 1")
        await page.keyboard.press("ArrowRight")
        await page.locator('img[data-screen-tour-image="corecircle-2"]')
          .waitFor({ state: "visible", timeout: WAIT_MS })
        const tries = (await trackedCalls(page)).filter(([name]) =>
          name === "case-try"
        )
        assertEquals(
          tries,
          ["2", "4", "1"].map((n) => [
            "case-try",
            { item: "corecircle", part: "tour", step: `corecircle-${n}` },
          ]),
          `${width}px`,
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
