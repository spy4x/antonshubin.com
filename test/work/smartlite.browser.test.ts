// #523: /work/smartlite in a browser: no axe violation, no sideways scroll and
// one h1 at 390 and 1440px, and "What an operator sees" moving with the keyboard and
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

Deno.test("the SmartLite page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/work/smartlite"),
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

Deno.test("SmartLite's tour moves with the arrow keys, Home and End, and sends case-try once per step", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, { viewport: { width, height: 900 } })
      try {
        await recordUmami(page)
        await page.goto(`${site.origin}/work/smartlite`, {
          waitUntil: "networkidle",
        })
        const tabs = page.getByRole("tablist", {
          name: "What an operator sees",
        })
          .getByRole("tab")
        const selected = () =>
          page.getByRole("tab", { selected: true }).innerText()
        await tabs.first().focus()
        await page.keyboard.press("ArrowRight")
        assert((await selected()).includes("Alerts"), await selected())
        await page.keyboard.press("End")
        assert((await selected()).includes("Profile"), await selected())
        await page.keyboard.press("Home")
        assert((await selected()).includes("Dashboard"), await selected())
        await page.locator('img[data-screen-tour-image="smartlite-alerts"]')
          .waitFor({ state: "attached" })
        const tries = (await trackedCalls(page)).filter(([name]) =>
          name === "case-try"
        )
        assertEquals(
          tries,
          ["alerts", "profile", "dashboard"].map((step) => [
            "case-try",
            { item: "smartlite", part: "tour", step: `smartlite-${step}` },
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

Deno.test("each box of How a click reaches a pole keeps its technology on the heading's line at 1440px (#562)", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await page.goto(`${site.origin}/work/smartlite`)
      const wrapped = await page.locator("[data-case-flow] li").evaluateAll(
        (boxes) =>
          boxes.filter((box) => {
            const h3 = box.querySelector("h3")!.getBoundingClientRect()
            const via = box.querySelector("[data-case-flow-via]")!
              .getBoundingClientRect()
            return via.top >= h3.top + h3.height / 2
          }).map((box) => box.querySelector("h3")!.textContent),
      )
      assertEquals(wrapped, [])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
