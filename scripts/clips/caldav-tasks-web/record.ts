/**
 * Records the browser half of the caldav-tasks-web demo clip against an app
 * that is already running and seeded (`run.sh` starts both):
 *
 *   deno run -A --config deno.json scripts/clips/caldav-tasks-web/record.ts <app-url> <out-dir>
 *
 * It signs in on a context that is not recorded, then records one take in a
 * second context with the saved session, so no sign-in appears in the clip.
 * Writes `<out-dir>/take.webm` and prints the seconds of blank start to trim.
 */
import { chromium, type Locator, type Page } from "playwright"
import { clickLike, moveLike, typeLike } from "./human-mouse.ts"

const [APP, OUT] = Deno.args
if (!APP || !OUT) throw new Error("usage: record.ts <app-url> <out-dir>")
const HERE = new URL(".", import.meta.url).pathname
/** The app's e2e owner password (its `e2e/env.ts`), a fixed test value `run.sh` passes in. */
const OWNER_PASSWORD = Deno.env.get("CLIP_OWNER_PASSWORD")
if (!OWNER_PASSWORD) throw new Error("CLIP_OWNER_PASSWORD is not set")

// A 1280 x 800 video. Playwright records CSS pixels, not device pixels, so the
// page is enlarged with CSS zoom on <body> instead: list text renders at about
// 19 px. The pointer and key caps hang off <html>, outside the zoom.
const VIEWPORT = { width: 1280, height: 800 }
const ZOOM = 1.2
const CONTEXT = {
  viewport: VIEWPORT,
  colorScheme: "dark" as const,
  timezoneId: "UTC",
  locale: "en-GB",
  serviceWorkers: "block" as const,
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms)

/** Glides the pointer onto `target` without clicking. */
async function hover(
  page: Page,
  pointer: { x: number; y: number },
  target: Locator,
) {
  await target.waitFor()
  const box = await target.boundingBox()
  if (!box) throw new Error("hover target has no box")
  await moveLike(page, pointer, {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
  })
}

/** Presses one key with a pause around it, so its key cap can be read. */
async function key(page: Page, name: string, after = 650) {
  await page.keyboard.press(name)
  await pause(page, after)
}

const browser = await chromium.launch()
try {
  const login = await browser.newContext(CONTEXT)
  const loginPage = await login.newPage()
  await loginPage.goto(APP)
  await loginPage.getByLabel("Password").fill(OWNER_PASSWORD)
  await loginPage.getByRole("button", { name: "Sign in" }).click()
  await loginPage.getByRole("heading", { name: "Today", level: 1 }).waitFor()
  const storageState = await login.storageState()
  await login.close()

  const context = await browser.newContext({
    ...CONTEXT,
    storageState,
    recordVideo: { dir: OUT, size: VIEWPORT },
  })
  const pointer = { x: 760, y: 420 }
  await context.addInitScript(
    `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
  )
  await context.addInitScript(
    `document.addEventListener("DOMContentLoaded", () => document.body.style.zoom = "${ZOOM}")`,
  )
  await context.addInitScript({ path: `${HERE}pointer.js` })
  await context.addInitScript({ path: `${HERE}keys.js` })
  const page = await context.newPage()
  const start = Date.now()
  const H = VIEWPORT.height
  const main = page.getByRole("main")
  try {
    await page.goto(APP)
    await main.getByText("Fix the gate").waitFor()
    await page.mouse.move(pointer.x, pointer.y)
    await pause(page, 500)
    const trim = (Date.now() - start) / 1000

    // 1. Today: overdue and due-today tasks from three lists.
    await pause(page, 2500)

    // 2. Quick add with a tag, a time and a priority; it lands in Today.
    await typeLike(
      page,
      pointer,
      main.getByLabel("New task"),
      "Order compost #garden 5pm !1",
      H,
    )
    await pause(page, 1300)
    await page.keyboard.press("Enter")
    await main.getByRole("button", { name: "Order compost", exact: true })
      .waitFor()
    await pause(page, 1800)

    // 3. The Errands list: Plan the garden with its subtasks; move one up by keyboard.
    await clickLike(
      page,
      pointer,
      page.getByRole("link", { name: "Lists" }),
      H,
    )
    await clickLike(
      page,
      pointer,
      main.getByText("Errands", { exact: true }),
      H,
    )
    await main.getByRole("button", { name: "Clear the beds", exact: true })
      .waitFor()
    await pause(page, 1200)
    const handle = main.getByRole("button", { name: "Reorder Clear the beds" })
    await hover(page, pointer, handle)
    await handle.focus()
    await pause(page, 400)
    await key(page, "Space")
    await key(page, "ArrowUp")
    await key(page, "Space", 1500)

    // 4. A weekly repeat on Water the plants.
    await clickLike(
      page,
      pointer,
      main.getByRole("button", { name: "Water the plants", exact: true }),
      H,
    )
    const repeat = main.getByLabel("Repeat", { exact: true })
    await repeat.waitFor()
    await pause(page, 700)
    await repeat.scrollIntoViewIfNeeded()
    await hover(page, pointer, repeat)
    await pause(page, 300)
    await repeat.selectOption({ label: "Weekly" })
    await pause(page, 1500)
    await clickLike(
      page,
      pointer,
      main.getByRole("button", { name: "Save", exact: true }),
      H,
    )
    await pause(page, 1200)

    // 5. Complete a task on Today, then Undo.
    await clickLike(
      page,
      pointer,
      page.getByRole("link", { name: "Today" }),
      H,
    )
    await main.getByText("Call the plumber").waitFor()
    await pause(page, 900)
    await clickLike(
      page,
      pointer,
      main.getByRole("checkbox", { name: "Complete Call the plumber" }),
      H,
    )
    const undo = page.getByRole("button", { name: "Undo" })
    await undo.waitFor()
    await pause(page, 900)
    await clickLike(page, pointer, undo, H)
    await main.getByRole("button", { name: "Call the plumber", exact: true })
      .waitFor()
    await pause(page, 1200)

    // 6. The shortcuts sheet.
    await moveLike(page, pointer, { x: 760, y: 420 })
    await page.locator("body").focus()
    await key(page, "?", 1800)
    await key(page, "Escape", 600)

    // 7. Final frame: Today with the new task in it.
    await pause(page, 2400)
    console.log(
      JSON.stringify({ trim, seconds: (Date.now() - start) / 1000 - trim }),
    )
  } finally {
    const video = page.video()
    await context.close()
    if (video) await Deno.rename(await video.path(), `${OUT}/take.webm`)
  }
} finally {
  await browser.close()
}
