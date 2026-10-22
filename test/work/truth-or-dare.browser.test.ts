// /work/truth-or-dare (#523) in a browser: axe and no sideways scroll at 390
// and 1440px, and the architecture map lights exactly the boxes of the picked
// flow, from the keyboard, with JavaScript on and off. Needs a built site and
// Chromium; see docs/testing.md "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { AxeBuilder } from "@axe-core/playwright"
import type { Browser, Page } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium } from "../browser.ts"
import { dareEdges, dareFlows, flowNodes } from "../../lib/darechat-map.ts"

// @axe-core/playwright types its page with its own playwright-core.
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]["page"]

const PATH = "/work/truth-or-dare"

/** The ids of the boxes and arrows drawn lit (the Lamp fill), and the flow sentence shown. */
function litState(page: Page) {
  return page.evaluate(() => {
    const lamp = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-lamp").trim()
    const probe = document.createElement("div")
    probe.style.background = lamp
    document.body.append(probe)
    const lampRgb = getComputedStyle(probe).backgroundColor
    probe.remove()
    const filled = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(selector)]
        .filter((el) => getComputedStyle(el).backgroundColor === lampRgb)
    const lit = filled("[data-dare-node]").map((el) => el.dataset.dareNode!)
    const arrows = filled("[data-dare-edge]").map((el) => el.dataset.dareEdge!)
    const shown = [
      ...document.querySelectorAll<HTMLElement>("[data-dare-sentence]"),
    ].filter((el) => getComputedStyle(el).visibility === "visible")
      .map((el) => el.dataset.dareSentence!)
    return { lit, arrows, shown }
  })
}

Deno.test("/work/truth-or-dare has no axe violations and no sideways scroll at 390 and 1440px", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const found: string[] = []
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      })
      try {
        const page = await context.newPage()
        await page.goto(site.origin + PATH, { waitUntil: "load" })
        const wide = await page.evaluate(() =>
          document.documentElement.scrollWidth - innerWidth
        )
        if (wide > 0) found.push(`${width}px: ${wide}px of sideways scroll`)
        const { violations } = await new AxeBuilder({
          page: page as unknown as AxePage,
        }).withTags(["wcag2a", "wcag2aa"]).analyze()
        for (const v of violations) {
          found.push(`${width}px: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`)
        }
      } finally {
        await context.close()
      }
    }
    assertEquals(found, [])
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("picking a flow from the keyboard lights exactly its boxes and arrows and shows its sentence, with JavaScript on and off", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({
        javaScriptEnabled,
        viewport: { width: 390, height: 844 },
      })
      try {
        const page = await context.newPage()
        await page.goto(site.origin + PATH, { waitUntil: "load" })
        const ids = (flow: Parameters<typeof flowNodes>[0]) =>
          flowNodes(flow).map((n) => n.id)
        const arrows = (flow: Parameters<typeof flowNodes>[0]) =>
          dareEdges.filter((e) => e.flow === flow).map((e) => e.id)
        const at = `JavaScript ${javaScriptEnabled ? "on" : "off"}`
        assertEquals(
          await litState(page),
          {
            lit: ids("requests"),
            arrows: arrows("requests"),
            shown: ["requests"],
          },
          at,
        )
        await page.locator("#dare-flow-requests").focus()
        for (const { id: flow } of dareFlows.slice(1)) {
          await page.keyboard.press("ArrowRight")
          assertEquals(
            await litState(page),
            { lit: ids(flow), arrows: arrows(flow), shown: [flow] },
            `${at}, ${flow}`,
          )
        }
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
