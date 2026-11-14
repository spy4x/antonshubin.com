// Browser-driven guard for the two copy buttons: /pay's address buttons
// (`islands/CopyButton.tsx`) and a blog post's code-block Copy button
// (`islands/BlogImageEnhancer.tsx`). Both copy through `@spy4x/platform`'s
// `copyToClipboard`, which tries the async Clipboard API and falls back to a
// hidden textarea and `execCommand("copy")`. Each case replaces both browser
// paths with fakes and checks what a visitor reads afterwards.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "./harness.ts"
import { launchChromium, newPage, WAIT_MS } from "./browser.ts"
import { blogArticles } from "../lib/data.ts"

type Mode = "async-ok" | "legacy-ok" | "fails"

/** Installs fake clipboard paths before any page script runs and records what was copied. */
async function fakeClipboard(page: Page, mode: Mode) {
  await page.addInitScript((m: string) => {
    const w = globalThis as unknown as { __copied: string[] }
    w.__copied = []
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: m === "async-ok"
        ? { writeText: (t: string) => (w.__copied.push(t), Promise.resolve()) }
        : { writeText: () => Promise.reject(new Error("denied")) },
    })
    document.execCommand = (cmd: string) => {
      if (cmd !== "copy" || m !== "legacy-ok") return false
      const ta = document.querySelector("textarea")
      w.__copied.push(ta?.value ?? "")
      return true
    }
  }, mode)
}

async function withPage(
  mode: Mode,
  path: string,
  run: (page: Page) => Promise<void>,
) {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    await fakeClipboard(page, mode)
    await page.goto(`${site.origin}${path}`, { waitUntil: "networkidle" })
    await run(page)
  } finally {
    await browser?.close()
    await site.stop()
  }
}

const copied = (page: Page) =>
  page.evaluate(() =>
    (globalThis as unknown as { __copied: string[] }).__copied
  )

/** The computed colour of a token class, resolved live so a token edit can't desync a check. */
const tokenColor = (page: Page, cls: string) =>
  page.evaluate((c) => {
    const span = document.createElement("span")
    span.className = c
    document.body.append(span)
    const color = getComputedStyle(span).color
    span.remove()
    return color
  }, cls)

/**
 * Whether a button reading `text` settles on `color`. Polled, because the
 * button's colour transition takes a moment to settle.
 */
const settlesOn = (page: Page, text: string, color: string) =>
  page.waitForFunction(
    ([t, c]) =>
      [...document.querySelectorAll("button")].some((b) =>
        b.textContent?.trim() === t && getComputedStyle(b).color === c
      ),
    [text, color],
    { timeout: WAIT_MS },
  ).then(() => true, () => false)

Deno.test("the /pay copy button reads its label in Graphite, then Copied in Parchment after the clipboard takes the address", async () => {
  await withPage("async-ok", "/pay", async (page) => {
    const button = page.getByRole("button", { name: "Copy EVM address" })
    assert(
      await settlesOn(
        page,
        "Copy EVM address",
        await tokenColor(page, "text-graphite"),
      ),
      "the idle button is not in Graphite",
    )
    await button.click()
    await page.getByText("Copied", { exact: true }).first().waitFor({
      timeout: WAIT_MS,
    })
    assert(
      await settlesOn(page, "Copied", await tokenColor(page, "text-parchment")),
      "Copied is not in Parchment",
    )
    const [text] = await copied(page)
    assert(/^0x[0-9a-fA-F]{40}$/.test(text), `copied ${text}`)
  })
})

Deno.test("the /pay copy button still copies through the textarea fallback when the clipboard API rejects", async () => {
  await withPage("legacy-ok", "/pay", async (page) => {
    await page.getByRole("button", { name: "Copy EVM address" }).click()
    await page.getByText("Copied", { exact: true }).first().waitFor({
      timeout: WAIT_MS,
    })
    assertEquals((await copied(page)).length, 1)
  })
})

Deno.test("the /pay copy button says Copy failed in Brick, not Copied, when nothing could be copied", async () => {
  await withPage("fails", "/pay", async (page) => {
    await page.getByRole("button", { name: "Copy EVM address" }).click()
    const failed = page.getByRole("button", { name: "Copy failed" })
    await failed.waitFor({ timeout: WAIT_MS })
    assertEquals(await page.getByText("Copied", { exact: true }).count(), 0)
    assert(
      await settlesOn(
        page,
        "Copy failed",
        await tokenColor(page, "text-brick"),
      ),
      "Copy failed is not in the error colour",
    )
  })
})

Deno.test("a post's code Copy button reads Copied on success and Copy failed when nothing could be copied", async () => {
  const slug = "building-mcp-servers-with-deno"
  assert(blogArticles.some((a) => a.slug === slug), "sample post is gone")
  await withPage("async-ok", `/blog/${slug}`, async (page) => {
    const button = page.locator("[data-copy-code]").first()
    await button.waitFor({ state: "visible" })
    await button.click()
    await page.waitForFunction(() =>
      document.querySelector("[data-copy-code]")?.textContent === "Copied"
    )
  })
  await withPage("fails", `/blog/${slug}`, async (page) => {
    const button = page.locator("[data-copy-code]").first()
    await button.waitFor({ state: "visible" })
    await button.click()
    await page.waitForFunction(() =>
      document.querySelector("[data-copy-code]")?.textContent === "Copy failed"
    )
  })
})

Deno.test("a post's code Copy button reads Copied when the clipboard API rejects and the textarea fallback works", async () => {
  await withPage(
    "legacy-ok",
    "/blog/building-mcp-servers-with-deno",
    async (page) => {
      const button = page.locator("[data-copy-code]").first()
      await button.waitFor({ state: "visible" })
      await button.click()
      await page.waitForFunction(() =>
        document.querySelector("[data-copy-code]")?.textContent === "Copied"
      )
      assertEquals((await copied(page)).length, 1)
    },
  )
})
