// Browser-driven guard for #445: the /book contact card keeps the email
// address on one line, inside its column, with no horizontal scroll. The 88px
// labels rail (#444) once squeezed the card at 1024px until `break-all` split
// the address before its last letter. Runs under `deno task test:browser`.
import { assert } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "./harness.ts"
import { launchChromium, newPage } from "./browser.ts"

const WIDTHS = [320, 390, 768, 1024, 1028, 1060, 1100, 1280, 1440]

Deno.test("the /book email address stays on one line inside its column", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const problems: string[] = []
    for (const width of WIDTHS) {
      const page = await newPage(browser, { viewport: { width, height: 900 } })
      await page.goto(`${site.origin}/book`, { waitUntil: "load" })
      const m = await page.evaluate(() => {
        const card = document.querySelector("[data-contact-facts]")
        const link = card?.querySelector("a[href^='mailto:']")
        if (!card || !link) return null
        const lines = new Set(
          [...link.getClientRects()].map((r) => Math.round(r.top)),
        )
        return {
          lines: lines.size,
          linkRight: link.getBoundingClientRect().right,
          colRight: link.closest("dd")?.getBoundingClientRect().right ?? 0,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }
      })
      await page.close()
      assert(m, "no mailto link in [data-contact-facts]; the selector is stale")
      if (m.lines !== 1) problems.push(`${width}px: ${m.lines} lines`)
      if (m.linkRight > m.colRight + 0.5) {
        const over = Math.ceil(m.linkRight - m.colRight)
        problems.push(`${width}px: link ends ${over}px past its column`)
      }
      if (m.scrollWidth > m.clientWidth) {
        problems.push(`${width}px: page scrolls sideways`)
      }
    }
    assert(problems.length === 0, problems.join(", "))
  } finally {
    await browser?.close()
    await site.stop()
  }
})
