// /tools/rostok (#461) in a browser: the frame's shared check (axe, no
// sideways scroll, one <h1> at 390 and 1440px), a catalog stack that opens
// to its add command with JavaScript off, and no sideways scroll at 390px
// with every stack open (long variable keys such as CALDAV_MCP_SERVER_URL). Needs a built site and
// Chromium; see docs/testing.md "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, newPage } from "../browser.ts"
import { toolPageProblems } from "../tool-frame.ts"
import { catalogGroups, rostokCatalog } from "../../lib/rostok-catalog.ts"
import { findTool } from "../../lib/tools.ts"

Deno.test("a screen reader hears each rostok category as its name, a comma and its stack count, and each tool page link names its tool", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    await page.goto(`${site.origin}/tools/rostok`)
    await page.evaluate(() =>
      document.querySelectorAll("details").forEach((d) => d.open = true)
    )
    const groups = catalogGroups()
    assert(groups.some((g) => g.stacks.length === 1), "no one-stack category")
    assert(groups.some((g) => g.stacks.length > 1), "no many-stack category")
    const nav = page.getByRole("navigation", { name: "Jump to a category" })
    for (const g of groups) {
      const n = g.stacks.length
      const text = `${g.label}, ${n} ${n === 1 ? "stack" : "stacks"}`
      // Chromium puts a space before the hidden comma, since the label and
      // the count are separate flex items; a screen reader reads it the same.
      const name = new RegExp(
        `^${g.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} ?, ${n} ${
          n === 1 ? "stack" : "stacks"
        }$`,
      )
      const link = nav.getByRole("link", { name })
      const heading = page.getByRole("heading", { level: 3, name })
      assertEquals(await link.count(), 1, `jump link "${text}"`)
      assertEquals(await heading.count(), 1, `heading "${text}"`)
      assertEquals(await link.textContent(), text)
      assertEquals((await heading.textContent())?.trim(), text)
    }

    const own = rostokCatalog.stacks.flatMap((s) => findTool(s.name) ?? [])
    assert(own.length > 1, "fewer than two catalog stacks are tools")
    assertEquals(
      await page.getByRole("link", { name: /^This tool's page/ }).count(),
      own.length,
    )
    for (const t of own) {
      const link = page.getByRole("link", {
        name: `This tool's page (${t.name})`,
        exact: true,
      })
      assertEquals(await link.count(), 1, t.name)
      assertEquals(await link.textContent(), `This tool's page (${t.name})`)
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("/tools/rostok passes the shared tool page check, a stack opens to its add command without JavaScript, and open stacks fit a 390px screen", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/rostok"),
        [],
      )
    } finally {
      await page.close()
    }

    const noJs = await newPage(browser, { javaScriptEnabled: false })
    try {
      await noJs.goto(`${site.origin}/tools/rostok`)
      const add = noJs.locator("#add-zond")
      assert(!(await add.isVisible()), "the stack starts closed")
      await noJs.locator("[data-stack=zond] summary").click()
      assertEquals(
        (await add.textContent())?.trim(),
        "rostok stack add zond --server=home",
      )
      assert(await add.isVisible(), "the stack opened")
    } finally {
      await noJs.close()
    }

    const phone = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    try {
      await phone.goto(`${site.origin}/tools/rostok`)
      await phone.evaluate(() =>
        document.querySelectorAll("details").forEach((d) => d.open = true)
      )
      assertEquals(
        await phone.evaluate(() =>
          document.documentElement.scrollWidth - globalThis.innerWidth
        ),
        0,
        "the page scrolls sideways at 390px with every stack open",
      )
    } finally {
      await phone.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
