// The browser check every custom case page in this folder runs (#523).
import { AxeBuilder } from "@axe-core/playwright"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium } from "../browser.ts"

// @axe-core/playwright types its page with its own playwright-core, a minor
// version ahead of the site's; the methods it calls are the same.
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]["page"]

/** RFC 2606 host: Book renders only with a booking URL. */
export const SCHEDULE = "https://meet.example.com/book"

/**
 * Every axe violation and sideways scroll on `path` at 390 and 1440px, one
 * line each; empty when the page is sound.
 */
export async function casePageProblems(path: string): Promise<string[]> {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } })
  let browser: Browser | undefined
  const found: string[] = []
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      // AxeBuilder needs a page from an explicit context.
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      })
      try {
        const page = await context.newPage()
        const where = `${path} at ${width}px`
        await page.goto(`${site.origin}${path}`, { waitUntil: "networkidle" })
        const scroll = await page.evaluate(() =>
          document.documentElement.scrollWidth
        )
        if (scroll > width) found.push(`${where} is ${scroll}px wide`)
        const results = await new AxeBuilder({
          page: page as unknown as AxePage,
        }).withTags(["wcag2a", "wcag2aa"]).analyze()
        for (const v of results.violations) {
          for (const n of v.nodes) {
            found.push(`${where} ${v.id}: ${n.html.slice(0, 160)}`)
          }
        }
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
  return found
}
