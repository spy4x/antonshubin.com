// #523: /work/roley in a browser: no axe violation, no sideways scroll and
// one h1 at 390 and 1440px, and "Make a movie in four steps" moving with the keyboard and
// sending case-try once per step. Needs a built site and Chromium; see
// docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
} from "../browser.ts"
import { toolPageProblems } from "../tool-frame.ts"

Deno.test("the Roley page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/work/roley"),
        [],
      )
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Roley's tour moves with the arrow keys, Home and End, and sends case-try once per step", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, { viewport: { width, height: 900 } })
      try {
        await recordUmami(page)
        await page.goto(`${site.origin}/work/roley`, {
          waitUntil: "networkidle",
        })
        const tabs = page.getByRole("tablist", {
          name: "Make a movie in four steps",
        })
          .getByRole("tab")
        const selected = () =>
          page.getByRole("tab", { selected: true }).innerText()
        await tabs.first().focus()
        await page.keyboard.press("ArrowRight")
        assert(
          (await selected()).includes("Record scene by scene"),
          await selected(),
        )
        await page.keyboard.press("End")
        assert((await selected()).includes("Watch the movie"), await selected())
        await page.keyboard.press("Home")
        assert((await selected()).includes("Pick a script"), await selected())
        await page.locator(
          'img[data-screen-tour-image="roley-recorder-mobile"]',
        )
          .waitFor({ state: "attached" })
        const tries = (await trackedCalls(page)).filter(([name]) =>
          name === "case-try"
        )
        assertEquals(
          tries,
          ["recorder-mobile", "watch-mobile", "scripts-mobile"].map((step) => [
            "case-try",
            { item: "roley", part: "tour", step: `roley-${step}` },
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
