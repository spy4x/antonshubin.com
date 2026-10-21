// #459: the /tools/ts-libs page in a browser: the shared tool page check, and
// "Pick a package" as a visitor uses it, by mouse and by keyboard. Needs a
// built site and Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, newPage, WAIT_MS } from "../browser.ts"
import { toolPageProblems } from "../tool-frame.ts"

Deno.test("the ts-libs page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/ts-libs"),
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

Deno.test("opening a package closes the open one, and the click lands on the summary that carries tool-try, by mouse on its name and by Enter", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await page.goto(`${site.origin}/tools/ts-libs`, {
        waitUntil: "networkidle",
      })
      // Umami's tracker reads the event from a click's own target when no
      // link or button holds it, so record what each click's target says.
      await page.evaluate(() => {
        const g = globalThis as unknown as { __targets: unknown[] }
        g.__targets = []
        document.addEventListener("click", (e) => {
          const el = e.target as Element
          g.__targets.push([
            el.getAttribute("data-umami-event"),
            el.getAttribute("data-umami-event-part"),
          ])
        }, true)
      })
      const open = () =>
        page.locator("details[data-package][open]").evaluateAll((els) =>
          els.map((el) => el.getAttribute("data-package"))
        )
      assertEquals(await open(), ["validation"])

      // A click on the name inside the summary, not on the summary's edge.
      // The mouse goes to the name's box: Playwright's own click refuses an
      // element that lets clicks through, which is what the name does.
      const code = page.locator("[data-package=email] summary code")
      await code.scrollIntoViewIfNeeded({ timeout: WAIT_MS })
      const name = await code.boundingBox({ timeout: WAIT_MS })
      assert(name, "the email package's name has no box")
      await page.mouse.click(name.x + 10, name.y + name.height / 2)
      assertEquals(await open(), ["email"])

      await page.locator("[data-package=time] summary").focus()
      await page.keyboard.press("Enter")
      assertEquals(await open(), ["time"])
      assert(
        await page.locator("[data-package=time] pre").isVisible(),
        "the example shows once open",
      )

      assertEquals(
        await page.evaluate(() =>
          (globalThis as unknown as { __targets: unknown[] }).__targets
        ),
        [["tool-try", "email"], ["tool-try", "time"]],
      )
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
