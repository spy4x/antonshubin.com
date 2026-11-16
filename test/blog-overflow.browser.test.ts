// Browser-driven guards for the Writing pages. #222: at 390px no blog post
// is wider than the screen, and no "Read next" row ends past its right edge
// (the old Previous/Next cards once ran 335px past it while an ancestor
// clipped them, so only each row's own box shows such an overflow). #274:
// /blog and five sample posts have no horizontal scroll and no axe
// violations at 390 and 1440px, and the image lightbox closes on a tap
// beside the image. #609: the tables of two posts with long prose cells
// wrap to fit the column at both widths, and a short value stays on one
// line. Runs under `deno task test:browser`, sharing
// test/browser.ts's Chromium launch.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import axeCore from "axe-core"
import { startSite } from "./harness.ts"
import { launchChromium, newPage } from "./browser.ts"

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation on the loaded page. */
async function axeViolations(page: Page): Promise<string[]> {
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

Deno.test("no blog post or its Read next rows run past the screen at 390px", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    const xml = await site.html("/sitemap.xml")
    const posts = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => p.startsWith("/blog/"))
    assert(posts.length > 1, "sitemap.xml lists no blog posts")
    let rowsSeen = 0

    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    const wide: string[] = []
    for (const path of posts) {
      await page.goto(`${site.origin}${path}`, { waitUntil: "load" })
      const { scrollWidth, clientWidth, rows } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        rows: [...document.querySelectorAll("[data-read-next] li")].map((
          li,
        ) => li.getBoundingClientRect().right),
      }))
      if (scrollWidth > clientWidth) {
        wide.push(`${path} (page ${scrollWidth}px)`)
      }
      rowsSeen += rows.length
      for (const right of rows) {
        if (right > clientWidth) {
          wide.push(`${path} (row ends at ${Math.round(right)}px)`)
        }
      }
    }
    assert(
      rowsSeen > 0,
      "no [data-read-next] row found; the selector is stale",
    )
    assert(
      wide.length === 0,
      `these posts run past a 390px screen: ${wide.join(", ")}`,
    )
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("/blog and five sample posts have no horizontal scroll and no axe violations at 390 and 1440px", async () => {
  // A long post with code and a contents list, a short one, one with images.
  const paths = [
    "/blog",
    "/blog/building-mcp-servers-with-deno",
    "/blog/zond-sso-probe-bridge",
    "/blog/ship-it-today",
    // The two posts with wide tables (#334).
    "/blog/opus-5-5-vs-sonnet-5-agent-costs",
    "/blog/preact-component-library-without-shadcn",
  ]
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, {
        viewport: { width, height: 900 },
      })
      try {
        for (const path of paths) {
          await page.goto(`${site.origin}${path}`, {
            waitUntil: "networkidle",
          })
          const where = `${path} at ${width}px`
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }))
          assert(scrollWidth <= clientWidth, `${where}: ${scrollWidth}px`)
          assertEquals(await axeViolations(page), [], where)
        }
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("prose tables wrap to fit the column at 390 and 1440px, without splitting a code name or a short value", async () => {
  // #609: with nowrap cells these ran 1602px and 931px wide in a 748px column.
  // A code name with no space or hyphen (`Deno.errors.NotFound`) stays on one
  // line: split mid-word, it read as two names.
  const paths = [
    `/blog/migrate-from-deno-to-node-and-bun`,
    `/blog/seed-saas-starter`,
  ]
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, {
        viewport: { width, height: 900 },
      })
      try {
        for (const path of paths) {
          await page.goto(`${site.origin}${path}`, { waitUntil: `load` })
          const { boxes, split } = await page.evaluate(() => ({
            boxes: [
              ...document.querySelectorAll(`.blog-content > .table-scroll`),
            ].map((el) => [el.scrollWidth, el.clientWidth]),
            split: [...document.querySelectorAll(`.table-scroll td code`)]
              .filter((el) =>
                !/[\s-]/.test(el.textContent ?? ``) &&
                el.getClientRects().length > 1
              )
              .map((el) => el.textContent),
          }))
          const where = `${path} at ${width}px`
          assertEquals(split, [], `${where}: code split across lines`)
          assert(boxes.length > 0, `${where}: no table found`)
          for (const [scroll, client] of boxes) {
            assert(
              scroll <= client,
              `${where}: table ${scroll}px > ${client}px`,
            )
          }
        }
        // A short value keeps its line: with every cell free to wrap, the
        // column shrank and "Sep 20–21" printed as "Sep" / "20–" / "21".
        await page.goto(
          `${site.origin}/blog/opus-5-5-vs-sonnet-5-agent-costs`,
          {
            waitUntil: `load`,
          },
        )
        const lines = await page.evaluate(() => {
          const cell = [...document.querySelectorAll(`.table-scroll td`)]
            .find((el) => el.textContent === `Sep 20–21`)
          if (!cell?.firstChild) return -1
          const range = document.createRange()
          range.selectNodeContents(cell.firstChild)
          return range.getClientRects().length
        })
        assertEquals(lines, 1, `"Sep 20–21" lines at ${width}px`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("the post lightbox closes on a tap beside the image, clear of the notch", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    // A phone turned sideways: the case the close button used to sit under
    // the notch in (UX 8).
    const page = await newPage(browser, {
      viewport: { width: 844, height: 390 },
    })
    await page.goto(`${site.origin}/blog/ship-it-today`, {
      waitUntil: "networkidle",
    })
    const trigger = page.locator("[data-lightbox]").first()
    const name = await trigger.getAttribute("aria-label")
    assert(name?.startsWith("View larger image: "), `trigger named ${name}`)
    await trigger.click()
    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ state: "visible" })

    // The close button keeps its safe-area inset from the right edge.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { right: 47, top: 0, bottom: 21, left: 47 },
    })
    const close = dialog.getByRole("button", { name: "Close" })
    const box = await close.boundingBox()
    assert(box, "the close button has no box")
    assert(
      box.x + box.width <= 844 - 47,
      `the close button ends at ${box.x + box.width}px, under a 47px inset`,
    )

    // A tap on the frame beside the image closes it.
    await page.mouse.click(20, 195)
    await dialog.waitFor({ state: "hidden" })
    assertEquals(
      await page.evaluate(() =>
        document.activeElement?.hasAttribute("data-lightbox") ?? false
      ),
      true,
      "focus must return to the image button",
    )
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("a post's cover fills the phone's column and opens whole in the lightbox", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    // A phone at 3x: a srcset that called a 580px file "1000w" drew this
    // cover 228px wide in a 358px column.
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    })
    // Hold the picture back: its box must already have its final size, or
    // the article jumps down when it arrives.
    let release = () => {}
    const held = new Promise<void>((r) => release = r)
    await page.route(/\/cover-full[^/]*\.webp/, async (route) => {
      await held
      await route.continue()
    })
    // A 580x282 meme: at 390px its width, not the 28rem cap, limits it.
    await page.goto(`${site.origin}/blog/zond-sso-probe-bridge`, {
      waitUntil: "domcontentloaded",
    })
    const trigger = page.locator("[data-post-cover] [data-lightbox]")
    const before = await trigger.locator("img").boundingBox()
    release()
    await page.waitForLoadState("networkidle")
    await trigger.locator("img").evaluate((img: HTMLImageElement) =>
      img.decode()
    )
    const after = await trigger.locator("img").boundingBox()
    assert(
      before && after && Math.abs(before.height - after.height) < 1,
      `the cover's box was ${before?.height}px tall before it loaded, ${after?.height}px after`,
    )
    const [cover, column] = await Promise.all([
      trigger.locator("img").boundingBox(),
      page.locator("[data-post-cover]").boundingBox(),
    ])
    assert(cover && column, "the cover has no box")
    assert(
      cover.width >= column.width - 1,
      `the cover is ${cover.width}px wide in a ${column.width}px column`,
    )
    await trigger.click()
    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ state: "visible" })
    const src = await dialog.locator("img").getAttribute("src")
    assert(src?.includes("/cover-full.webp"), `the lightbox shows ${src}`)
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("at 1440px Tab reaches On this page before the post's links, and the side column stays on the right", async () => {
  // #584: the side column sits beside the post's top, so the keyboard
  // reaches it before the article's own links, not after "Read next".
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    await page.goto(`${site.origin}/blog/building-mcp-servers-with-deno`, {
      waitUntil: "load",
    })
    const [aside, article] = await Promise.all([
      page.locator(".post-aside").boundingBox(),
      page.locator("article.post-column").boundingBox(),
    ])
    assert(aside && article, "the post has no side column")
    assert(
      aside.x >= article.x + article.width,
      `the side column starts at ${aside.x}px, left of the post's end at ${
        article.x + article.width
      }px`,
    )
    let reached = ""
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press("Tab")
      reached = await page.evaluate(() => {
        const el = document.activeElement
        if (el?.closest('nav[aria-label="On this page"]')) return "toc"
        if (el?.closest("article")) return "article"
        return ""
      })
    }
    assertEquals(reached, "toc", "Tab reached the post before On this page")
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("no line of a post's code block hides behind a sideways scroll at 390 and 1440px", async () => {
  // #596: article code wraps rather than scrolls. The passkey post's first
  // block scrolled even at 1440px.
  const site = await startSite()
  let browser: Browser | undefined
  try {
    const xml = await site.html("/sitemap.xml")
    const posts = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .filter((p) => p.startsWith("/blog/"))
    const known = "/blog/passkey-autofill-bitwarden-tab-focus"
    assert(posts.includes(known), `sitemap.xml no longer lists ${known}`)
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, {
        viewport: { width, height: 900 },
      })
      try {
        const hidden: string[] = []
        let measured = 0
        for (const path of posts) {
          await page.goto(`${site.origin}${path}`, { waitUntil: "load" })
          const widths = await page.$$eval(
            ".blog-content pre",
            (pres) => pres.map((p) => [p.scrollWidth, p.clientWidth]),
          )
          if (path === known) {
            assert(
              widths.length > 0,
              `${known} has no code block at ${width}px`,
            )
          }
          measured += widths.length
          widths.forEach(([scroll, client], i) => {
            if (scroll > client + 1) {
              hidden.push(`${path} block ${i + 1} (${scroll}px in ${client}px)`)
            }
          })
        }
        assert(
          measured > 0,
          "no .blog-content pre found; the selector is stale",
        )
        assertEquals(hidden, [], `code scrolls sideways at ${width}px`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("a code line holding one long unbroken token, such as a URL, breaks inside the box at 390px", async () => {
  // Some posts hold such tokens (the oko post's sha256 image digest), but the
  // test writes its own into a block so the case stays covered if they change.
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    await page.goto(
      `${site.origin}/blog/passkey-autofill-bitwarden-tab-focus`,
      { waitUntil: "load" },
    )
    const [scroll, client] = await page.locator(".blog-content pre").first()
      .evaluate((pre) => {
        pre.querySelector("code")?.append(
          `\nhttps://example.com/${"a".repeat(200)}`,
        )
        return [pre.scrollWidth, pre.clientWidth]
      })
    assert(scroll <= client + 1, `the token runs ${scroll}px in ${client}px`)
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("a wrapped code line continues 2ch past its own indent at 390px, never at column 0", async () => {
  // #596 design gate: wrapped YAML that restarts at column 0 reads as a new
  // key at the wrong level. The Woodpecker post's database line wraps.
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    await page.goto(`${site.origin}/blog/self-hosted-ci-with-woodpecker`, {
      waitUntil: "load",
    })
    const bad = await page.$$eval(".blog-content .code-line", (lines) => {
      const out: string[] = []
      let wrapped = 0
      for (const line of lines) {
        const probe = document.createElement("span")
        probe.textContent = "0"
        line.closest("pre")!.append(probe)
        const ch = probe.getBoundingClientRect().width
        probe.remove()
        const range = document.createRange()
        range.selectNodeContents(line)
        const rects = [...range.getClientRects()].filter((r) => r.width > 0)
        const first = Math.min(...rects.map((r) => r.top))
        const rest = rects.filter((r) => r.top > first + 1)
        if (rest.length === 0) continue
        wrapped++
        const indent = parseInt(
          (line as HTMLElement).style.getPropertyValue("--indent") || "0",
        )
        const want = line.getBoundingClientRect().left + (indent + 2) * ch
        const left = Math.min(...rest.map((r) => r.left))
        if (left < want - 1) {
          out.push(
            `${line.textContent!.trim().slice(0, 40)}: ${left} < ${want}`,
          )
        }
      }
      return wrapped ? out : [`no code line wraps; the test checks nothing`]
    })
    assertEquals(bad, [])
  } finally {
    await browser?.close()
    await site.stop()
  }
})
