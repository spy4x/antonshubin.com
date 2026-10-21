/**
 * Records the browser half of the Seed demo clip on a local Seed dev stack
 * that `stage.ts` has staged: three Playwright videos, one per scene, with a
 * drawn pointer driven at a person's pace (`human-mouse.ts`, `pointer.js`).
 *
 * 1. app: the Notes list of "Demo team"; a new note with a tag, saved; the
 *    group's members.
 * 2. admin: the people table; a search; one person's sessions, groups and
 *    activity.
 * 3. result: the Notes list again, with the new note on top, held.
 *
 * Writes `<out>/<scene>.webm` and `<out>/cuts.json`, which gives each video's
 * start and end in seconds (the blank first frames and the load are cut).
 *
 * Usage: deno run -A scripts/clips/seed/browser.ts <app-state.json> <admin-state.json> <out-dir>
 */
import { type Browser, chromium, type Page } from "playwright"
import { clickLike, typeLike } from "./human-mouse.ts"

const APP = "http://app.localhost"
const ADMIN = "http://admin.localhost"
/** The page area inside the drawn browser window; see compose.sh. */
const VIEWPORT = { width: 1376, height: 796 }
const POINTER = new URL("./pointer.js", import.meta.url).pathname

/** The title typed in the clip; made up. */
export const NEW_NOTE = "Launch checklist for Friday"

interface Cut {
  scene: string
  file: string
  start: number
  end: number
}

interface Scene {
  page: Page
  /** Seconds since the video started. */
  at: () => number
  pointer: { x: number; y: number }
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms)

/** Opens a recording page at `url`, signed in from `state`, with the pointer at `start`. */
async function openScene(
  browser: Browser,
  state: string,
  out: string,
  url: string,
  ready: (page: Page) => Promise<void>,
  start: { x: number; y: number } | null,
): Promise<Scene & { close: () => Promise<string>; ready: number }> {
  const context = await browser.newContext({
    storageState: state,
    viewport: VIEWPORT,
    recordVideo: { dir: out, size: VIEWPORT },
    colorScheme: "dark",
    reducedMotion: "no-preference",
    locale: "en-GB",
    timezoneId: "Europe/London",
  })
  const page = await context.newPage()
  const t0 = Date.now()
  if (start) {
    await page.addInitScript(
      `window.__demoPointerStart = ${JSON.stringify(start)}`,
    )
    await page.addInitScript({ path: POINTER })
  }
  await page.goto(url)
  // A fresh dev stack stalls or restarts its Vite servers on first loads: reload, at most 3 tries.
  for (let attempt = 1;; attempt++) {
    try {
      await ready(page)
      break
    } catch (error) {
      if (attempt === 3) throw error
      await page.reload()
    }
  }
  if (start) await page.mouse.move(start.x, start.y)
  await pause(page, 300)
  const at = () => (Date.now() - t0) / 1000
  return {
    page,
    at,
    pointer: start ? { ...start } : { x: 0, y: 0 },
    ready: at(),
    close: async () => {
      const video = page.video()
      await context.close()
      if (!video) throw new Error("no video recorded")
      return await video.path()
    },
  }
}

async function main() {
  const [appState, adminState, out] = Deno.args
  if (!appState || !adminState || !out) {
    throw new Error(
      "usage: browser.ts <app-state.json> <admin-state.json> <out-dir>",
    )
  }
  const h = VIEWPORT.height
  const cuts: Cut[] = []
  const browser = await chromium.launch()
  try {
    // Scene 1: the app.
    const notesReady = async (page: Page) => {
      await page.locator("[data-e2e=note-item-title]").first().waitFor({
        timeout: 60_000,
      })
      await page.waitForLoadState("networkidle")
    }
    const app = await openScene(
      browser,
      appState,
      out,
      `${APP}/notes`,
      notesReady,
      {
        x: 720,
        y: 470,
      },
    )
    const { page: a, pointer: pa } = app
    await pause(a, 500)
    await clickLike(a, pa, a.locator("[data-e2e=note-new]"), h)
    await a.locator("[data-e2e=note-title]").waitFor()
    await pause(a, 300)
    await typeLike(a, pa, a.locator("[data-e2e=note-title]"), NEW_NOTE, h)
    await pause(a, 200)
    await clickLike(
      a,
      pa,
      a.getByRole("button", { name: "Roadmap", exact: true }),
      h,
    )
    await pause(a, 300)
    await clickLike(a, pa, a.locator("[data-e2e=note-save]"), h)
    await pause(a, 500)
    await clickLike(a, pa, a.getByRole("link", { name: "Groups" }).first(), h)
    await a.getByRole("link", { name: /Demo team/ }).waitFor()
    await pause(a, 300)
    await clickLike(a, pa, a.getByRole("link", { name: /Demo team/ }), h)
    const members = a.locator("[data-e2e=group-member]").first()
    await members.waitFor()
    await pause(a, 200)
    await a.evaluate(() => {
      const heading = [...document.querySelectorAll("h2, h3")].find((el) =>
        el.textContent?.startsWith("Members")
      )
      heading?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    await pause(a, 1300)
    const appEnd = app.at()
    cuts.push({
      scene: "app",
      file: await app.close(),
      start: app.ready,
      end: appEnd,
    })

    // Scene 2: the admin panel.
    const usersReady = async (page: Page) => {
      await page.locator("[data-e2e=admin-users-list] tbody tr").first()
        .waitFor({
          timeout: 60_000,
        })
      await page.waitForLoadState("networkidle")
    }
    const admin = await openScene(
      browser,
      adminState,
      out,
      `${ADMIN}/users`,
      usersReady,
      {
        x: 760,
        y: 520,
      },
    )
    const { page: b, pointer: pb } = admin
    await pause(b, 400)
    await typeLike(
      b,
      pb,
      b.locator("[data-e2e=admin-users-search]"),
      "Maya",
      h,
    )
    await pause(b, 200)
    await b.keyboard.press("Enter")
    await b.waitForURL(/\?q=Maya/)
    await pause(b, 600)
    await clickLike(b, pb, b.getByRole("link", { name: "Maya Chen" }), h)
    await b.locator("[data-e2e=admin-user-title]").waitFor()
    await pause(b, 500)
    for (const tab of [/^Sessions/, /^Groups/, /^Activity/]) {
      await clickLike(b, pb, b.getByRole("tab", { name: tab }), h)
      await pause(b, 650)
    }
    await pause(b, 300)
    const adminEnd = admin.at()
    cuts.push({
      scene: "admin",
      file: await admin.close(),
      start: admin.ready,
      end: adminEnd,
    })

    // Scene 3: the result, held.
    const result = await openScene(
      browser,
      appState,
      out,
      `${APP}/notes`,
      notesReady,
      null,
    )
    const top = await result.page.locator("[data-e2e=note-item-title]").first()
      .textContent()
    if (top?.trim() !== NEW_NOTE) {
      throw new Error(`the newest note is "${top}", not the new one`)
    }
    await pause(result.page, 3000)
    const resultEnd = result.at()
    cuts.push({
      scene: "result",
      file: await result.close(),
      start: result.ready,
      end: resultEnd,
    })

    await Deno.writeTextFile(`${out}/cuts.json`, JSON.stringify(cuts, null, 2))
    console.log(
      cuts.map((c) => `${c.scene}: ${(c.end - c.start).toFixed(1)} s`).join(
        ", ",
      ),
    )
  } finally {
    await browser.close()
  }
}

if (import.meta.main) await main()
