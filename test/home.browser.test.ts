// Browser guards for the home page's first screen (#529): both actions sit
// above the fold on a 390x844 phone, above the sticky tab bar, and from
// 1024px the "At a glance" card is as tall as the hero's text column. Runs
// under `deno task test:browser`, sharing test/browser.ts's Chromium launch.
import { assert } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "./harness.ts"
import { launchChromium, newPage } from "./browser.ts"
import { BOOK_LABEL, BRIEF_LABEL } from "../lib/nav.ts"

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

Deno.test("the home hero's card is as tall as its text column at 1440px, with both actions on the first screen", async () => {
  const site = await startSite({ env: { SCHEDULE_URL } })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${site.origin}/`, { waitUntil: "networkidle" })
    const { text, card } = await page.evaluate(() => {
      const hero = document.querySelector('[data-home-section="hero"]')!
      const box = (el: Element) => {
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom }
      }
      return {
        text: box(hero.firstElementChild!),
        card: box(hero.querySelector("[data-home-facts]")!),
      }
    })
    assert(
      Math.abs(text.top - card.top) < 1 &&
        Math.abs(text.bottom - card.bottom) < 1,
      `text ${JSON.stringify(text)}, card ${JSON.stringify(card)}`,
    )
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
