// Shared checks for every /tools/<slug> page (#454): the parts of the tool
// frame each page keeps, in the built HTML and in a browser. A custom page's
// own test (`test/tools-<slug>.test.ts`) calls these, so it checks only its
// middle; `test/tool-frame.test.ts` and `test/tool-frame.browser.test.ts`
// run them over every tool page.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import axeCore from "axe-core"
import type { Page } from "playwright"
import { count, pageBody, visibleText } from "./html.ts"
import { heroStill } from "../components/tool-frame/tool-page.ts"
import type { Tool } from "../lib/tools.ts"

/** Every `<img ... loading="eager">` (or with no `loading`) in `html`. */
function eagerImages(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag).filter((
    tag,
  ) => !/loading="lazy"/.test(tag))
}

/**
 * Checks the built HTML of `tool`'s page against the frame: one `<h1>`
 * reading the `headline` (else "name: job"); a top line that holds the name,
 * the job (unless the header carries `data-tool-job-hidden`) and the status
 * mark above a headline, without repeating that headline, and the status
 * mark alone above "name: job"; at most one eager image, with
 * `fetchpriority="high"`, inside the hero media (with the frame's default
 * media it is the hero still, when the tool has one; a page's own media,
 * marked `data-tool-own-media`, may have none); the facts card with "View on
 * GitHub" as its only link to the repository; the "Two ways to use it" band
 * with the page body's one Book; and More tools after it ending with "All
 * tools". A custom page's choices are read from the markers the frame
 * writes, so its test passes no options. `html` is the whole page; the
 * checks look at the page body only.
 */
export function assertToolFrame(tool: Tool, html: string): void {
  const where = `/tools/${tool.slug}`
  const page = pageBody(html)

  const h1s = [...page.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)]
  assertEquals(h1s.length, 1, `${where}: <h1> count`)
  assertEquals(
    visibleText(h1s[0][0]),
    tool.headline ?? `${tool.name}: ${tool.job}`,
    `${where}: <h1> text`,
  )

  const heroAt = page.indexOf("data-tool-hero")
  assert(heroAt !== -1, `${where}: no hero`)
  const heroTag = page.slice(heroAt, page.indexOf(">", heroAt))
  const jobHidden = heroTag.includes("data-tool-job-hidden")
  const ownMedia = heroTag.includes("data-tool-own-media")

  const topStart = page.indexOf("data-tool-eyebrow")
  assert(topStart !== -1, `${where}: no top line`)
  const top = page.slice(topStart, page.indexOf("</p>", topStart))
  const topText = visibleText(`<x ${top}`)
  assert(
    top.includes(`data-tool-status="${tool.status}"`) && /<svg/.test(top),
    `${where}: status mark`,
  )
  if (tool.headline) {
    assert(topText.startsWith(tool.name), `${where}: top line "${topText}"`)
    assertEquals(topText.includes(tool.job), !jobHidden, `${where}: job`)
    const claim = tool.headline.toLowerCase().replace(/[.!?]$/, "")
    assert(
      !topText.toLowerCase().includes(claim),
      `${where}: the top line repeats the headline: "${topText}"`,
    )
  } else {
    // The H1 already reads "name: job"; the top line says neither again.
    assert(
      !topText.includes(tool.name) && !topText.includes(tool.job),
      `${where}: the top line repeats the <h1>: "${topText}"`,
    )
  }

  const eager = eagerImages(page)
  const still = heroStill(tool)
  const media = page.indexOf("data-tool-media")
  if (ownMedia) assert(eager.length <= 1, `${where}: eager images`)
  else assertEquals(eager.length, still ? 1 : 0, `${where}: eager images`)
  if (eager.length) {
    assert(eager[0].includes('fetchpriority="high"'), `${where}: priority`)
    assert(
      media !== -1 && page.indexOf(eager[0]) > media,
      `${where}: the eager image is not the hero media`,
    )
    if (!ownMedia) {
      assert(eager[0].includes(`src="${still!.src}`), `${where}: ${eager[0]}`)
    }
  }
  assertEquals(
    count(page, /fetchpriority="high"/g),
    eager.length,
    `${where}: high-priority images`,
  )

  const facts = page.indexOf('aria-label="Tool facts"')
  assert(facts !== -1, `${where}: no facts card`)
  const card = page.slice(facts, page.indexOf("</aside>", facts))
  const repo = `https://github.com/${tool.repo}`
  const repoLinks = [
    ...card.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g),
  ]
    .filter(([, href]) => href === repo || href.startsWith(`${repo}/`))
    .map(([, , text]) => visibleText(text))
  assertEquals(
    repoLinks,
    tool.repo ? ["View on GitHub"] : [],
    `${where}: the facts card's links to the repository`,
  )
  const bandAt = page.indexOf("data-closing-band")
  const moreAt = page.indexOf("data-tool-more")
  assert(facts < bandAt && bandAt < moreAt, `${where}: part order`)

  const band = page.slice(bandAt, moreAt)
  assert(
    visibleText(`<x ${band}`).startsWith("Two ways to use it"),
    `${where}: band heading`,
  )
  assertEquals(count(band, /data-tool-door="/g), 2, `${where}: band columns`)
  // Book shows only when a booking URL is set; the browser checks run with one.
  assertEquals(
    count(page, /data-primary-book/g),
    count(band, /data-primary-book/g),
    `${where}: a Book outside the band`,
  )
  assert(
    count(page, /data-primary-book/g) <= 1,
    `${where}: more than one Book`,
  )

  const text = visibleText(page)
  for (const gone of ["Report an issue", "Star on GitHub", "Don't use it if"]) {
    assert(!text.includes(gone), `${where}: "${gone}"`)
  }
  assert(
    page.includes(`/tools" data-umami-event="cta"`) &&
      text.includes("All tools"),
    `${where}: All tools`,
  )
}

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation on `page`. */
export async function axeViolations(page: Page): Promise<string[]> {
  // Injected through page.evaluate, not a <script> tag, so the site's CSP
  // does not block it (see test/contrast.browser.test.ts).
  await page.evaluate(axeCore.source)
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    })
  }) as { violations: { id: string; nodes: { html: string }[] }[] }
  return results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
  )
}

/**
 * Opens `${origin}${path}` at 390 and 1440px in `page` and returns every
 * problem found: an axe-core WCAG 2 A/AA violation, a page wider than its
 * viewport, or a count of `<h1>` other than one. An empty list is a pass.
 */
export async function toolPageProblems(
  page: Page,
  origin: string,
  path: string,
): Promise<string[]> {
  const problems: string[] = []
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport)
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" })
    const at = `${path} at ${viewport.width}px`
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
    )
    if (overflow > 0) problems.push(`${at}: scrolls sideways by ${overflow}px`)
    const h1 = await page.locator("h1").count()
    if (h1 !== 1) problems.push(`${at}: ${h1} <h1>`)
    for (const v of await axeViolations(page)) problems.push(`${at}: ${v}`)
  }
  return problems
}
