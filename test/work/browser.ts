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

/**
 * The case frame's layout slips on `paths` (#562), one line each; empty when
 * the pages are sound. At 390 and 1440px a top-line part that wraps to a new
 * line has its "·" outside a box that clips it, so no line starts or ends
 * with one. At 1440px
 * the title block starts at the top of the hero row, and no strip
 * screenshot is wider or taller than the hero picture (2px for its frame).
 */
export async function caseLayoutProblems(paths: string[]): Promise<string[]> {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } })
  let browser: Browser | undefined
  const found: string[] = []
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      })
      try {
        const page = await context.newPage()
        for (const path of paths) {
          await page.goto(`${site.origin}${path}`, {
            waitUntil: "networkidle",
          })
          const problems = await page.evaluate(async (wide) => {
            const out: string[] = []
            const top = document.querySelector("[data-case-top]")!
            const box = top.parentElement!.getBoundingClientRect()
            const clips = ["hidden", "clip"].includes(
              getComputedStyle(top.parentElement!).overflowX,
            )
            let lineTop = -Infinity
            for (const part of Array.from(top.children)) {
              const rect = part.getBoundingClientRect()
              const dot = part.firstElementChild!.getBoundingClientRect()
              const newLine = rect.top > lineTop + 1
              lineTop = Math.max(lineTop, rect.top)
              const shown = dot.right > box.left + 1
              if (newLine && shown) {
                out.push(`a line starts with "·": ${part.textContent}`)
              }
              if (!shown && !clips) {
                out.push(
                  `a "·" outside the box is not clipped: ${part.textContent}`,
                )
              }
              if (!newLine && !shown) {
                out.push(`a "·" is hidden mid-line: ${part.textContent}`)
              }
            }
            if (!wide) return out
            const block = document.querySelector("[data-case-hero-block]")!
            const gap = top.getBoundingClientRect().top -
              block.getBoundingClientRect().top
            if (gap > 1) out.push(`the top line starts ${gap}px down`)
            const hero = document.querySelector("img[data-case-hero]")
            const shots = Array.from(
              document.querySelectorAll<HTMLImageElement>(
                "[data-case-strip] li img",
              ),
            )
            if (!hero || shots.length === 0) return out
            for (const img of shots) img.loading = "eager"
            await Promise.all(shots.map((img) => img.decode().catch(() => {})))
            const h = hero.getBoundingClientRect()
            for (const img of shots) {
              const r = img.getBoundingClientRect()
              if (r.width > h.width + 2 || r.height > h.height + 2) {
                out.push(
                  `${img.alt} is ${Math.round(r.width)}x${
                    Math.round(r.height)
                  }, the hero ${Math.round(h.width)}x${Math.round(h.height)}`,
                )
              }
            }
            return out
          }, width >= 1024)
          for (const p of problems) found.push(`${path} at ${width}px: ${p}`)
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
