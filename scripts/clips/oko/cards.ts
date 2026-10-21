/**
 * Takes the three card crops of the /tools/oko page's "From config to card"
 * (#464) from the same staged oko as the clip (record.ts):
 *
 *   deno run -A scripts/clips/oko/cards.ts [--out static/img/tools/oko]
 *
 * The Audiobooks card, in turn: up (after a short outage, so its 30-day
 * uptime is a real figure below 100%), down (its nginx stopped until gatus
 * reports it down) and unknown (gatus itself stopped, so oko gets no
 * answer). Each is a WebP about 480px wide. Containers, network, browser
 * and the work directory are removed on success, failure and Ctrl-C.
 */
import { join, resolve } from "@std/path"
import { chromium } from "playwright"
import { HERE, log, makeCerts, ROOT, run, sleep, stage } from "./record.ts"

/** Seconds of gatus history before the first crop, and the outage inside it. */
const WARMUP = 150
const OUTAGE = 15
/** CSS pixels of oko's page around the card, so its corners sit on oko's own background. */
const MAT = 10

async function main() {
  const i = Deno.args.indexOf("--out")
  const out = i === -1
    ? join(ROOT, "static/img/tools/oko")
    : resolve(Deno.args[i + 1])
  const work = await Deno.makeTempDir({ prefix: "oko-cards-" })
  const net = `oko-cards-${Date.now().toString(36)}`
  const docker = (...a: string[]) => run("docker", a)
  const cleanup = async () => {
    for (const c of ["oko", "gatus", "web", "git", "mail"]) {
      await docker("rm", "-f", "-v", `${net}-${c}`).catch(() => {})
    }
    await docker("network", "rm", net).catch(() => {})
    await Deno.remove(work, { recursive: true }).catch(() => {})
  }
  const onSignal = () => cleanup().finally(() => Deno.exit(130))
  Deno.addSignalListener("SIGINT", onSignal)
  Deno.addSignalListener("SIGTERM", onSignal)
  const browser = await chromium.launch()
  try {
    await makeCerts(join(work, "certs"))
    await Deno.mkdir(join(work, "stage"))
    await Deno.copyFile(
      join(HERE, "config.json"),
      join(work, "stage/config.json"),
    )
    await Deno.copyFile(join(HERE, "gatus.yaml"), join(work, "gatus.yaml"))
    const url = await stage(net, work)
    log(
      `oko at ${url}; ${WARMUP} s of history, Audiobooks down for ${OUTAGE} s`,
    )
    const t0 = Date.now()
    await sleep(40_000)
    await docker("stop", "-t", "1", `${net}-web`)
    await sleep(OUTAGE * 1000)
    await docker("start", `${net}-web`)
    await sleep(Math.max(0, t0 + WARMUP * 1000 - Date.now()))

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    })
    await Deno.mkdir(out, { recursive: true })
    const shoot = async (state: string) => {
      // ?refresh=1 makes oko ask gatus now instead of serving its cache; the
      // state keeps the browser from reusing the previous page.
      await page.goto(`${url}?refresh=1&state=${state}`, {
        waitUntil: "networkidle",
      })
      await page.evaluate(() => document.fonts.ready.then(() => true))
      // Leave the search box, so its focus ring is not in the picture.
      await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
      const box = await page.locator(".service").first().boundingBox()
      if (!box) throw new Error("no Audiobooks card")
      const png = join(work, `card-${state}.png`)
      await page.screenshot({
        path: png,
        clip: {
          x: box.x - MAT,
          y: box.y - MAT,
          width: box.width + 2 * MAT,
          height: box.height + 2 * MAT,
        },
      })
      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        png,
        "-c:v",
        "libwebp",
        "-quality",
        "88",
        join(out, `card-${state}.webp`),
      ])
      log(
        `card-${state}.webp: ${await page.locator(".service").first()
          .getAttribute("class")}`,
      )
    }
    await shoot("up")
    await docker("stop", "-t", "1", `${net}-web`)
    await sleep(20_000)
    await shoot("down")
    await docker("stop", "-t", "1", `${net}-gatus`)
    await shoot("unknown")
  } finally {
    await browser.close()
    Deno.removeSignalListener("SIGINT", onSignal)
    Deno.removeSignalListener("SIGTERM", onSignal)
    await cleanup()
  }
}

if (import.meta.main) await main()
