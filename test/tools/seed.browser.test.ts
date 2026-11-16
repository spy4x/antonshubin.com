// Seed's own page (#455) in a browser: the shared check (axe, no sideways
// scroll, one <h1> at 390 and 1440px) with "The next commands" closed and
// open, plus axe's label-content-name-mismatch and each card link's name
// (#643). Needs a built site and Chromium; see docs/testing.md "Browser-driven
// tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, newPage } from "../browser.ts"
import { axeViolations, toolPageProblems } from "../tool-frame.ts"

Deno.test("the Seed page has no axe violation (label-in-name included), sideways scroll or extra h1, with the next commands closed or open", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      const problems = await toolPageProblems(page, site.origin, "/tools/seed")
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${site.origin}/tools/seed`, {
          waitUntil: "networkidle",
        })
        await page.getByText("The next commands", { exact: true }).click()
        const at = `/tools/seed at ${width}px, next commands open`
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
        if (overflow > 0) {
          problems.push(`${at}: scrolls sideways by ${overflow}px`)
        }
        // The commands wrap rather than scroll inside their boxes.
        for (const id of ["seed-setup-commands", "seed-dev-command"]) {
          const inner = await page.locator(`#${id}`).evaluate((el) => {
            const pre = el.parentElement!
            return pre.scrollWidth - pre.clientWidth
          })
          if (inner > 0) {
            problems.push(`${at}: #${id} scrolls by ${inner}px`)
          }
        }
        for (
          const v of [
            ...await axeViolations(page),
            // Off in the WCAG tags; #643: the Open links named by "Open …" only.
            ...await axeViolations(page, ["label-content-name-mismatch"]),
          ]
        ) problems.push(`${at}: ${v}`)
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

Deno.test("each See it running card's link is named by its visible text in order, without the shot's alt", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      await page.goto(`${site.origin}/tools/seed`, { waitUntil: "networkidle" })
      const links = page.locator("[data-seed-surface]")
      assertEquals(await links.count(), 2)
      for (const link of await links.all()) {
        // innerText has the card's words in order (the new-tab hint too) and
        // no alt, so an exact match proves both.
        const text = (await link.innerText()).replace(/\s+/g, " ").trim()
        const named = page.getByRole("link", { name: text, exact: true })
        assertEquals(await named.count(), 1, `no link named "${text}"`)
      }
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
