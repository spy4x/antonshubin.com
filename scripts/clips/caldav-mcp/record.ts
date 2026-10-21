/**
 * Records the clip: replays `exchange.json` (the real exchange from
 * exchange.ts) in `replay.html` at 1280x800, typing each question into the
 * composer with a visible pointer, and writes `<out>/raw.webm` plus
 * `<out>/trim.txt` (seconds of blank start to cut). `record.sh` encodes it.
 *
 *   deno run -A scripts/clips/caldav-mcp/record.ts <exchange.json> <out dir>
 */
import { chromium } from "playwright"
import { clickLike, moveLike, typeLike } from "./human-mouse.ts"

const W = 1280
const H = 800
const here = new URL(".", import.meta.url).pathname

const [exchangePath, out] = Deno.args
if (!exchangePath || !out) {
  throw new Error("usage: record.ts <exchange.json> <out dir>")
}
const exchange = JSON.parse(await Deno.readTextFile(exchangePath))
await Deno.mkdir(out, { recursive: true })

const browser = await chromium.launch()
try {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: out, size: { width: W, height: H } },
    colorScheme: "dark",
    timezoneId: "UTC",
    locale: "en-GB",
  })
  try {
    const pointer = { x: 900, y: 520 }
    await context.addInitScript(
      `window.__demoPointerStart = ${JSON.stringify(pointer)};` +
        `window.__exchange = ${JSON.stringify(exchange)};`,
    )
    await context.addInitScript({ path: `${here}pointer.js` })
    const tab = await context.newPage()
    tab.on("pageerror", (e) => console.error(`page error: ${e.message}`))
    const t0 = Date.now()
    await tab.goto(`file://${here}replay.html`)
    await tab.evaluate(() => document.fonts.ready)
    await tab.mouse.move(pointer.x, pointer.y)
    await Deno.writeTextFile(
      `${out}/trim.txt`,
      ((Date.now() - t0) / 1000).toFixed(2),
    )

    // Shot 1: the empty chat with the connected server, held to be read.
    await tab.waitForTimeout(2600)
    const field = tab.locator("#msg")
    const send = tab.locator("#send")
    for (let i = 0; i < exchange.turns.length; i++) {
      await typeLike(tab, pointer, field, exchange.turns[i].question, H)
      await tab.waitForTimeout(400)
      await clickLike(tab, pointer, send, H)
      // Glide the pointer off the column so it covers nothing while the turn plays.
      await moveLike(tab, pointer, { x: 1175, y: 640 })
      await tab.waitForFunction(
        (n) => (window as unknown as { __turnDone: number }).__turnDone >= n,
        i,
        {
          timeout: 60_000,
        },
      )
      await tab.waitForTimeout(i === exchange.turns.length - 1 ? 3000 : 2200)
    }
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
for await (const f of Deno.readDir(out)) {
  if (f.name.endsWith(".webm") && f.name !== "raw.webm") {
    await Deno.rename(`${out}/${f.name}`, `${out}/raw.webm`)
  }
}
console.log(`recorded ${out}/raw.webm`)
