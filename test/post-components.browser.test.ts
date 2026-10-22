// #537: a post's interactive components hydrate and react. The server
// renders each one disabled with the post's own numbers; once its island
// runs, the controls work by pointer and keyboard, the result follows them,
// and the first input sends one `post-try` with no value the reader entered.
// axe-core checks every component box at 390 and 1440px.
//
// Runs under `deno task test:browser` (its own -A task).
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0"
import { AxeBuilder } from "@axe-core/playwright"
import type { Browser, Page } from "playwright"
import { startSite } from "./harness.ts"
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "./browser.ts"

// @axe-core/playwright types its page with its own playwright-core, a minor
// version ahead of the site's; the methods it calls are the same.
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]["page"]

const TRAIL = "trail-code-claude-code-test"
const OPUS = "opus-5-5-vs-sonnet-5-agent-costs"
const LAB = "cost-optimization-laboratory"

/** Loads a post and waits until the figure with `id` has hydrated. */
async function openPost(page: Page, origin: string, slug: string, id: string) {
  await page.goto(`${origin}/blog/${slug}`, { waitUntil: "load" })
  await page.locator(`#${id}[data-live="true"]`).waitFor({ timeout: WAIT_MS })
}

Deno.test("the server renders each component disabled, with the post's own numbers", async () => {
  const site = await startSite()
  try {
    const trail = await site.html(`/blog/${TRAIL}`)
    assertStringIncludes(
      trail,
      "With runs that differ by 13%, you need 16 tasks to prove a 10% saving.",
    )
    assert(
      /id="how-many-tasks-figure"[^>]*data-live="false"/.test(trail),
      "the calculator is live before any script ran",
    )
    assert(/<fieldset disabled/.test(trail), "the sliders are not disabled")
    const opus = await site.html(`/blog/${OPUS}`)
    assertStringIncludes(
      opus,
      "At 75% cached reads, the same call costs 1.25× as much on Opus 5.5.",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the runs calculator follows its sliders and counts one post-try per view", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    try {
      await recordUmami(page)
      await openPost(page, site.origin, TRAIL, "how-many-tasks-figure")
      const result = page.locator("#how-many-tasks-figure [data-result]")
      const saving = page.getByRole("slider", {
        name: "The saving you want to prove",
      })
      await saving.focus()
      for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight")
      assertEquals(
        await result.textContent(),
        "With runs that differ by 13%, you need 6 tasks to prove a 20% saving.",
      )
      const noise = page.getByRole("slider", {
        name: "How much two identical runs differ",
      })
      await noise.focus()
      await page.keyboard.press("End")
      await saving.focus()
      await page.keyboard.press("Home")
      assertEquals(
        await result.textContent(),
        "More than 1,000 tasks. Cut the noise first, or look for a bigger saving.",
      )
      assertEquals(await trackedCalls(page), [
        ["post-try", { item: TRAIL, part: "RunsCalculator" }],
      ])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("the cached-share slider and the framework checklist react to the keyboard", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await recordUmami(page)
      await openPost(page, site.origin, OPUS, "per-call-price-figure")
      const share = page.getByRole("slider", {
        name: "Cached reads, as a share of the bill",
      })
      await share.focus()
      await page.keyboard.press("End")
      assertEquals(
        await page.locator("#per-call-price-figure [data-result]")
          .textContent(),
        "At 100% cached reads, the same call costs the same on both models.",
      )

      await openPost(page, site.origin, LAB, "decision-framework-figure")
      const result = page.locator("#decision-framework-figure [data-result]")
      const box = page.getByRole("checkbox", {
        name: "workload and capacity are reasonably predictable",
      })
      await box.focus()
      await page.keyboard.press("Space")
      assertStringIncludes(
        (await result.textContent()) ?? "",
        "Your ticks match these conditions for dedicated or self-managed infrastructure:",
      )
      const clear = page.getByRole("button", { name: "Clear answers" })
      await clear.click()
      assertEquals(await box.isChecked(), false)
      assert(
        !((await result.textContent()) ?? "").includes("Your ticks match"),
        "Clear answers left the mirror",
      )
      assertEquals(await trackedCalls(page), [
        ["post-try", { item: LAB, part: "FrameworkChecklist" }],
      ])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("every component box has no axe violation at 390 and 1440px", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const found: string[] = []
    for (const width of [390, 1440]) {
      // AxeBuilder needs a page from an explicit context, not
      // browser.newPage()'s implicit one; service workers stay blocked.
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: "block",
      })
      const page = await context.newPage()
      try {
        for (
          const [slug, id] of [
            [TRAIL, "how-many-tasks-figure"],
            [OPUS, "per-call-price-figure"],
            [LAB, "decision-framework-figure"],
          ]
        ) {
          await openPost(page, site.origin, slug, id)
          const boxes = await page.locator("[data-post-component]").count()
          assert(boxes > 0, `${slug} has no component box`)
          const results = await new AxeBuilder({
            page: page as unknown as AxePage,
          })
            .include("[data-post-component]")
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
          for (const v of results.violations) {
            for (const n of v.nodes) {
              found.push(`${width}px ${slug} ${v.id}: ${n.html.slice(0, 120)}`)
            }
          }
          const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > globalThis.innerWidth
          )
          assert(!overflow, `${slug} scrolls sideways at ${width}px`)
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
