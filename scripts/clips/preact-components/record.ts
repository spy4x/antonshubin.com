/**
 * Records the /tools/preact-components demo clip: a tour of the live UI guide
 * (the Orbit dashboard, light and dark, the accent colours, keyboard search
 * and a component with its code), ending on the overview's install line.
 *
 * Usage: deno run -A scripts/clips/preact-components/record.ts <out dir> [guide url]
 * Writes every painted frame to <out dir>/frames/ as a JPEG through the
 * DevTools screencast, and <out dir>/frames.txt, an ffmpeg concat list with
 * each frame's real duration. Playwright's own recordVideo is a 25 fps VP8 at
 * a low bitrate, which blurs the guide's small text. Then run encode.sh; see
 * README.md.
 */
import { chromium } from "playwright"
import type { Locator } from "playwright"
import { clickLike, moveLike } from "./human-mouse.ts"

const outDir = Deno.args[0]
if (!outDir) throw new Error("Usage: record.ts <out dir> [guide url]")
const GUIDE = Deno.args[1] ?? "https://spy4x.github.io/preact-components/"
// The guide is laid out at 1024x640 and painted at 1.25x, so the clip is
// 1280x800 with text a quarter larger: readable once the site shrinks it.
const W = 1024
const H = 640
const SCALE = 1.25
const here = new URL(".", import.meta.url).pathname
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
try {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
    colorScheme: "dark",
    locale: "en-GB",
    timezoneId: "UTC",
    permissions: ["clipboard-read", "clipboard-write"],
  })
  const pointer = { x: 800, y: 500 }
  await context.addInitScript(
    `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
  )
  await context.addInitScript({ path: here + "pointer.js" })
  await context.addInitScript({ path: here + "keys.js" })
  const page = await context.newPage()
  await Deno.mkdir(`${outDir}/frames`, { recursive: true })
  const frames: { file: string; ts: number }[] = []
  const cdp = await context.newCDPSession(page)
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = `frames/${String(frames.length).padStart(5, "0")}.jpg`
    Deno.writeFileSync(
      `${outDir}/${file}`,
      Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
    )
    frames.push({ file, ts: metadata.timestamp ?? Date.now() / 1000 })
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  })
  try {
    // Recording starts once the page and the pointer are in place, so the
    // clip has no blank start to trim.
    // Other work on this machine can change its network interfaces, which
    // Chromium reports as ERR_NETWORK_CHANGED: three tries, then give up.
    for (let attempt = 1;; attempt++) {
      try {
        await page.goto(GUIDE, { waitUntil: "networkidle" })
        break
      } catch (error) {
        if (attempt === 3) throw error
        await sleep(2000)
      }
    }
    await page.evaluate(() => document.fonts.ready)
    await page.mouse.move(pointer.x, pointer.y)
    await sleep(300)
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      maxWidth: W * SCALE,
      maxHeight: H * SCALE,
      everyNthFrame: 1,
    })
    await sleep(200)

    const smoothScrollTo = async (y: number, ms = 1100) => {
      await page.evaluate((top) => scrollTo({ top, behavior: "smooth" }), y)
      await sleep(ms)
    }
    const pageTop = (locator: Locator) =>
      locator.first().evaluate((e) =>
        Math.round(e.getBoundingClientRect().top + scrollY)
      )

    // 1. The overview: headline, Browse components, install line, counts.
    await moveLike(page, pointer, { x: 640, y: 470 })
    await sleep(1300)

    // 2. The Orbit dashboard: the filters, the KPIs and the chart in one
    // view; the chart's tooltip, then the Failing filter.
    const failing = page.getByRole("button", { name: /^Failing/ })
    const filtersView = (await pageTop(failing)) - 76
    await smoothScrollTo(filtersView, 1300)
    const cb = await page.locator("[aria-label^='Builds this week']").first()
      .boundingBox()
    if (!cb) throw new Error("chart has no box")
    await moveLike(page, pointer, {
      x: cb.x + cb.width * 0.3,
      y: cb.y + cb.height * 0.45,
    })
    await moveLike(page, pointer, {
      x: cb.x + cb.width * 0.53,
      y: cb.y + cb.height * 0.4,
    })
    await sleep(900)
    await clickLike(page, pointer, failing, H, false)
    await sleep(600)

    // 3. Down to the filtered table, then light and dark: the whole guide
    // repaints.
    const builds = page.getByRole("button", { name: "Builds", exact: true })
    await smoothScrollTo((await pageTop(builds)) - 300, 900)
    await sleep(500)
    const theme = page.getByRole("button", {
      name: /Switch to (light|dark) mode/,
    })
    await clickLike(page, pointer, theme, H, false)
    await sleep(1400)
    await clickLike(page, pointer, theme, H, false)
    await sleep(500)
    await smoothScrollTo(filtersView, 900)

    // 4. Accent colours, by keyboard on the select (a native popup is not
    // recorded by headless Chromium, so the pointer rests on it instead).
    const accent = page.getByLabel("Accent colour")
    const ab = await accent.boundingBox()
    if (!ab) throw new Error("accent select has no box")
    await moveLike(page, pointer, {
      x: ab.x + ab.width * 0.4,
      y: ab.y + ab.height + 18,
    })
    await accent.focus()
    for (let i = 0; i < 3; i++) {
      await sleep(200)
      await page.keyboard.press("ArrowDown")
      await sleep(850)
    }

    // 5. Keyboard: / opens search, "tabs", ↓, Enter; arrows move between tabs.
    // The select keeps focus and would take the "/", so it lets go first.
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur()
    )
    await page.keyboard.press("/")
    await sleep(400)
    await page.keyboard.type("tabs", { delay: 110 })
    await sleep(450)
    await page.keyboard.press("ArrowDown")
    await sleep(400)
    await page.keyboard.press("Enter")
    await sleep(1300)
    const card = page.locator("article#demo-Tabs")
    await clickLike(
      page,
      pointer,
      card.getByRole("tab", { name: /^Overview/ }),
      H,
    )
    await sleep(400)
    for (const key of ["ArrowRight", "ArrowRight", "ArrowLeft"]) {
      await page.keyboard.press(key)
      await sleep(600)
    }

    // 6. The component's code, copied.
    await clickLike(page, pointer, card.locator("[data-e2e=usage] summary"), H)
    await sleep(500)
    const cardTop = await card.evaluate((e) =>
      Math.round(e.getBoundingClientRect().top + scrollY)
    )
    await smoothScrollTo(cardTop + 250, 900)
    await clickLike(
      page,
      pointer,
      card.getByRole("button", { name: /^Copy the <Tabs/ }),
      H,
    )
    await sleep(1100)

    // 7. Back to the overview; the install line holds as the poster.
    await clickLike(
      page,
      pointer,
      page.getByRole("link", { name: "Overview", exact: true }).first(),
      H,
    )
    await page.evaluate(() => scrollTo({ top: 0 }))
    await sleep(700)
    await clickLike(
      page,
      pointer,
      page.getByRole("button", { name: "Copy the install command" }),
      H,
    )
    await moveLike(page, pointer, { x: 840, y: 560 })
    await sleep(1800)
    await cdp.send("Page.stopScreencast")
    const end = Date.now() / 1000
    // The concat demuxer needs the last file twice for its duration to count.
    const lines = frames.flatMap((f, i) => [
      `file '${f.file}'`,
      `duration ${((frames[i + 1]?.ts ?? end) - f.ts).toFixed(4)}`,
    ])
    lines.push(`file '${frames.at(-1)?.file}'`)
    await Deno.writeTextFile(`${outDir}/frames.txt`, lines.join("\n") + "\n")
    console.log(
      `${frames.length} frames, ${(end - frames[0].ts).toFixed(1)} s`,
    )
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
