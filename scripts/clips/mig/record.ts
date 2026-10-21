/**
 * Records the /tools/mig demo clip (#457): a guest books a meeting with a
 * local mig, lands on "You're booked", and the confirmation email opens in a
 * local Mailpit. Writes `static/video/tools/mig/demo.webm`, `demo.mp4`,
 * `poster.webp` and `poster-640.webp`.
 *
 *   deno run -A scripts/clips/mig/record.ts --mig <built mig checkout>
 *
 * `<built mig checkout>` is a clone of spy4x/mig after `deno install --frozen`
 * and `deno task build` (it needs `_fresh/server.js`). The script starts a
 * throwaway Mailpit container and the built mig with placeholder settings
 * only (Jane Doe, example.com addresses, Europe/Berlin). Chromium maps
 * meet.example.com to mig and mail.example.com to Mailpit and every other
 * host to nothing, so nothing on screen is real and nothing leaves the
 * machine. The container, mig, the browser and the temp directory are
 * removed on success and on failure. Needs Docker, ffmpeg and the pinned
 * Playwright Chromium. Not part of `deno task check`.
 */
import { join, resolve } from "@std/path"
import { chromium } from "playwright"
import type { Browser, BrowserContext, Page } from "playwright"
import { clickLike, moveLike, typeLike } from "./human-mouse.ts"

const ROOT = resolve(new URL("../../../", import.meta.url).pathname)
const OUT = join(ROOT, "static/video/tools/mig")
const POINTER_JS = new URL("./pointer.js", import.meta.url).pathname
/** Pinned by version and digest, so a new release cannot change the clip unnoticed. */
const MAILPIT_IMAGE =
  "axllent/mailpit:v1.31.3@sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d"
const VIEWPORT = { width: 1280, height: 800 }
/** One half of the final split frame, with an 8 px gap between the halves. */
const HALF = { width: 636, height: 800 }
const FPS = 30
const MEET = "http://meet.example.com"
const MAIL = "http://mail.example.com"
const GUEST = { name: "John Doe", email: "john@example.com" }
const SLOT = "15:30"
/** Seconds the final split frame holds. */
const POSTER_HOLD = 4.5
/** Seconds of each crossfade between the parts. */
const FADE = 0.4
/** The site's Ink, for the gap around the two halves of the final frame. */
const INK = "0x141210"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Runs a command to the end and returns its stdout, or throws with its stderr. */
async function must(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<string> {
  const out = await new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  })
    .output()
  const text = new TextDecoder()
  if (!out.success) {
    throw new Error(
      `${cmd} ${args[0]} failed:\n${text.decode(out.stderr).slice(-2000)}`,
    )
  }
  return text.decode(out.stdout)
}

/** Polls `check` every 300 ms until it returns true or the deadline passes. */
async function waitUntil(
  label: string,
  timeoutMs: number,
  check: () => Promise<boolean>,
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return
    await sleep(300)
  }
  throw new Error(`${label} not ready after ${timeoutMs / 1000}s`)
}

function freePort(): number {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 })
  const { port } = listener.addr as Deno.NetAddr
  listener.close()
  return port
}

/** The checkout's latest release tag without the "v", for mig's footer. */
async function migVersion(dir: string): Promise<string> {
  const tag =
    (await must("git", ["describe", "--tags", "--abbrev=0"], dir).catch(() =>
      ""
    )).trim()
  return /^v\d/.test(tag) ? tag.slice(1) : "1.0.0"
}

function argValue(name: string): string | undefined {
  const i = Deno.args.indexOf(name)
  return i === -1 ? undefined : Deno.args[i + 1]
}

/** A recording context: dark, Berlin, en-US, with the drawn pointer. */
async function recordingContext(
  browser: Browser,
  dir: string,
  start: { x: number; y: number },
): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    timezoneId: "Europe/Berlin",
    locale: "en-US",
    colorScheme: "dark",
    recordVideo: { dir, size: VIEWPORT },
  })
  await ctx.addInitScript(
    `window.__demoPointerStart = ${JSON.stringify(start)}`,
  )
  await ctx.addInitScript({ path: POINTER_JS })
  return ctx
}

/** A still-screenshot context: the same settings, no pointer, no video. */
function stillContext(
  browser: Browser,
  viewport = VIEWPORT,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    timezoneId: "Europe/Berlin",
    locale: "en-US",
    colorScheme: "dark",
  })
}

/** Closes the context to flush its video and returns the file. */
async function finishVideo(ctx: BrowserContext, page: Page): Promise<string> {
  const video = page.video()
  await ctx.close()
  const path = await video?.path()
  if (!path) throw new Error("Playwright recorded no video")
  return path
}

/** The first weekday from today whose 15:30 slot is still free. */
async function pickDate(browser: Browser): Promise<string> {
  const ctx = await stillContext(browser)
  try {
    const page = await ctx.newPage()
    await page.goto(`${MEET}/`, { waitUntil: "networkidle" })
    const days = page.locator(`[data-calendar-date]:not([disabled])`)
    const dates: string[] = []
    for (let i = 0; i < await days.count(); i++) {
      const d = await days.nth(i).getAttribute("data-calendar-date")
      if (d) dates.push(d)
    }
    for (const date of dates) {
      await page.goto(`${MEET}/?date=${date}`, { waitUntil: "networkidle" })
      const slot = page.locator(
        `section[aria-labelledby="step-time"] :is(button, a)`,
      )
        .filter({ hasText: new RegExp(`^\\s*${SLOT}\\s*$`) })
      if (await slot.count() > 0) return date
    }
    throw new Error(`no date in the picker has a free ${SLOT} slot`)
  } finally {
    await ctx.close()
  }
}

async function main() {
  const migDir = argValue("--mig")
  if (!migDir) throw new Error("usage: record.ts --mig <built mig checkout>")
  const mig = resolve(migDir)
  await Deno.stat(join(mig, "_fresh/server.js")).catch(() => {
    throw new Error(
      `${mig}/_fresh/server.js is missing: run \`deno task build\` there first`,
    )
  })

  const tmp = await Deno.makeTempDir({ prefix: "mig-clip-" })
  const container = `mig-clip-mailpit-${Deno.pid}`
  let containerStarted = false
  let server: Deno.ChildProcess | null = null
  let browser: Browser | null = null
  try {
    // Mailpit: SMTP for mig, and the inbox the clip opens.
    await must("docker", [
      "run",
      "-d",
      "--rm",
      "--name",
      container,
      "--pids-limit=500",
      "--memory=1g",
      "-p",
      "127.0.0.1::1025",
      "-p",
      "127.0.0.1::8025",
      "-e",
      "MP_SMTP_AUTH_ACCEPT_ANY=1",
      "-e",
      "MP_SMTP_AUTH_ALLOW_INSECURE=1",
      MAILPIT_IMAGE,
    ])
    containerStarted = true
    const hostPort = async (p: number) =>
      Number(
        (await must("docker", ["port", container, `${p}/tcp`])).trim().split(
          ":",
        ).pop(),
      )
    const smtpPort = await hostPort(1025)
    const uiPort = await hostPort(8025)
    const api = `http://127.0.0.1:${uiPort}/api/v1`
    await waitUntil(
      "Mailpit",
      30_000,
      async () => (await fetch(`${api}/info`)).ok,
    )

    // mig, with placeholder settings only.
    const port = freePort()
    server = new Deno.Command(Deno.execPath(), {
      args: [
        "serve",
        "-A",
        "--unstable-temporal",
        `--port=${port}`,
        "_fresh/server.js",
      ],
      cwd: mig,
      clearEnv: true,
      env: {
        PATH: Deno.env.get("PATH") ?? "",
        HOME: Deno.env.get("HOME") ?? tmp,
        ...(Deno.env.get("DENO_DIR")
          ? { DENO_DIR: Deno.env.get("DENO_DIR")! }
          : {}),
        HOST_NAME: "Jane Doe",
        HOST_EMAIL: "jane@example.com",
        HOST_TZ: "Europe/Berlin",
        MEETING_URL: "https://video.example.com/jane-doe",
        WEEKLY_AVAILABILITY: "MON-FRI 09:00-17:00",
        SLOT_DURATION_MIN: "30",
        // Two hours, so a run in the morning can still show today's 15:30.
        MIN_NOTICE_HOURS: "2",
        BOOKING_HORIZON_DAYS: "21",
        CANCEL_SECRET: btoa(
          String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
        ),
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: String(smtpPort),
        SMTP_USER: "jane@example.com",
        SMTP_PASSWORD: "placeholder",
        SMTP_FROM: "Bookings <book@example.com>",
        // Mailpit offers no TLS; mig 2 refuses a plaintext relay without this.
        SMTP_ALLOW_PLAINTEXT: "true",
        PUBLIC_URL: MEET,
        PORT: String(port),
        DATA_PATH: `${tmp}/bookings.json`,
        RATE_LIMIT_PER_5MIN: "100",
        MIG_VERSION: await migVersion(mig),
      },
      stdout: "null",
      stderr: "null",
    }).spawn()
    await waitUntil(
      "mig",
      30_000,
      async () => (await fetch(`http://127.0.0.1:${port}/health`)).ok,
    )

    browser = await chromium.launch({
      args: [
        `--host-resolver-rules=MAP meet.example.com 127.0.0.1:${port}, ` +
        `MAP mail.example.com 127.0.0.1:${uiPort}, MAP * ~NOTFOUND`,
        "--disable-features=HttpsUpgrades,LocalNetworkAccessChecks",
      ],
    })
    const date = await pickDate(browser)
    console.log(`booking ${date} ${SLOT}`)

    // Part 1: the booking, from the month grid to "You're booked".
    const pointer = { x: 980, y: 640 }
    const bookCtx = await recordingContext(browser, `${tmp}/book`, pointer)
    const book = await bookCtx.newPage()
    const bookStart = Date.now()
    await book.goto(`${MEET}/`, { waitUntil: "networkidle" })
    await book.mouse.move(pointer.x, pointer.y)
    await book.waitForTimeout(300)
    const bookTrim = (Date.now() - bookStart) / 1000
    await book.waitForTimeout(2200)
    await clickLike(
      book,
      pointer,
      book.locator(`[data-calendar-date="${date}"]`),
      VIEWPORT.height,
    )
    const slot = book.locator(
      `section[aria-labelledby="step-time"] :is(button, a)`,
    )
      .filter({ hasText: new RegExp(`^\\s*${SLOT}\\s*$`) }).first()
    await slot.waitFor()
    await book.waitForTimeout(1600)
    await clickLike(book, pointer, slot, VIEWPORT.height)
    await book.locator(`input[name="name"]`).waitFor()
    await book.waitForTimeout(1200)
    await typeLike(
      book,
      pointer,
      book.locator(`input[name="name"]`),
      GUEST.name,
      VIEWPORT.height,
    )
    await book.waitForTimeout(400)
    await typeLike(
      book,
      pointer,
      book.locator(`input[name="email"]`),
      GUEST.email,
      VIEWPORT.height,
    )
    await book.waitForTimeout(900)
    await clickLike(
      book,
      pointer,
      book.locator(`form[aria-label="Booking details"] button[type="submit"]`),
      VIEWPORT.height,
    )
    await book.waitForURL(/\/confirmed\?/, { timeout: 30_000 })
    const confirmedUrl = book.url()
    await book.waitForTimeout(700)
    await moveLike(book, pointer, { x: 1180, y: 720 })
    await book.waitForTimeout(2600)
    const bookVideo = await finishVideo(bookCtx, book)

    // The guest's email, as Mailpit received it.
    let messageId = ""
    await waitUntil("the guest's email", 30_000, async () => {
      const list = await (await fetch(`${api}/messages`)).json() as {
        messages: { ID: string; To: { Address: string }[] }[]
      }
      messageId = list.messages.find((m) =>
        m.To.some((t) => t.Address === GUEST.email)
      )?.ID ?? ""
      return messageId !== ""
    })

    // Part 2: the inbox, then the email opens.
    const mailPointer = { x: 980, y: 640 }
    const mailCtx = await recordingContext(browser, `${tmp}/mail`, mailPointer)
    // Mailpit's preview iframe paints white for a few frames before the dark
    // email loads into it; keep each iframe hidden until its document loads.
    await mailCtx.addInitScript(HIDE_BLANK_IFRAMES)
    const mail = await mailCtx.newPage()
    const mailStart = Date.now()
    await mail.goto(`${MAIL}/`, { waitUntil: "networkidle" })
    const row = mail.locator(`a[href$="/view/${messageId}"]`).first()
    await row.waitFor()
    await mail.mouse.move(mailPointer.x, mailPointer.y)
    await mail.waitForTimeout(300)
    const mailTrim = (Date.now() - mailStart) / 1000
    await mail.waitForTimeout(1000)
    await clickLike(mail, mailPointer, row, VIEWPORT.height)
    await mail.waitForURL(new RegExp(`/view/${messageId}`))
    await mail.waitForLoadState("networkidle")
    await mail.waitForTimeout(1300)
    // The .ics attachment is listed under the email once its details are shown.
    await clickLike(
      mail,
      mailPointer,
      mail.getByRole("button", { name: /Show attachment details/ }).filter({
        visible: true,
      }),
      VIEWPORT.height,
    )
    await mail.getByText("meeting.ics").filter({ visible: true }).first()
      .waitFor()
    await mail.waitForTimeout(300)
    // The message pane scrolls on its own, not the window: wheel over it in
    // small steps, so the scroll reads as a hand on a mouse wheel.
    for (let i = 0; i < 12; i++) {
      await mail.mouse.wheel(0, 25)
      await mail.waitForTimeout(40)
    }
    await mail.waitForTimeout(700)
    await moveLike(mail, mailPointer, { x: 1180, y: 700 })
    await mail.waitForTimeout(2200)
    const mailVideo = await finishVideo(mailCtx, mail)

    // Stills for the final split frame, without the pointer.
    // Each half is the real page rendered at half the width.
    const still = await stillContext(browser, HALF)
    const s1 = await still.newPage()
    await s1.goto(confirmedUrl, { waitUntil: "networkidle" })
    await s1.screenshot({
      path: `${tmp}/booked.png`,
      animations: "disabled",
      caret: "hide",
    })
    await s1.goto(`${MAIL}/view/${messageId}`, { waitUntil: "networkidle" })
    await s1.waitForTimeout(800)
    await s1.screenshot({
      path: `${tmp}/mail.png`,
      animations: "disabled",
      caret: "hide",
    })
    await still.close()

    await Deno.mkdir(OUT, { recursive: true })
    await encode(tmp, { bookVideo, bookTrim, mailVideo, mailTrim })
    // `--keep <dir>` copies the stills there, for checking the frames.
    const keep = argValue("--keep")
    if (keep) {
      for (const f of ["booked.png", "mail.png", "poster.png"]) {
        await Deno.copyFile(join(tmp, f), join(resolve(keep), f))
      }
    }
  } finally {
    await browser?.close().catch(() => {})
    if (server) {
      try {
        server.kill("SIGTERM")
      } catch {
        // already gone
      }
      await server.status
    }
    if (containerStarted) {
      await must("docker", ["rm", "-f", container]).catch(() => {})
    }
    await Deno.remove(tmp, { recursive: true })
  }
}

/** An init script: iframes stay transparent until a non-blank document has loaded. */
const HIDE_BLANK_IFRAMES = `(() => {
  if (globalThis !== globalThis.top) return
  const style = document.createElement("style")
  style.textContent = "iframe:not([data-demo-ready]) { opacity: 0 !important }"
  // An init script runs before <html> exists; the SPA adds its iframes later.
  const mount = () => (document.head ?? document.documentElement)?.appendChild(style)
  if (!mount()) document.addEventListener("DOMContentLoaded", mount)
  // On the document, not the window: an element's load event skips the window.
  document.addEventListener("load", (e) => {
    const f = e.target
    if (!(f instanceof HTMLIFrameElement)) return
    let blank = false
    try { blank = f.contentWindow.location.href === "about:blank" } catch { /* cross-origin */ }
    if (!blank) f.dataset.demoReady = "1"
  }, true)
})()`

/** Seconds of a media file, read with ffprobe. */
async function duration(file: string): Promise<number> {
  return Number(
    (await must("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      file,
    ])).trim(),
  )
}

/**
 * Joins the two parts and the split frame with short crossfades at a steady
 * frame rate, then writes the WebM (VP9), the MP4 (H.264, faststart) and the
 * WebP posters. The split frame is the left 640 px of "You're booked"
 * beside the left 640 px of the email, both from the real run.
 */
async function encode(
  tmp: string,
  p: {
    bookVideo: string
    bookTrim: number
    mailVideo: string
    mailTrim: number
  },
) {
  const poster = `${tmp}/poster.png`
  await must("ffmpeg", [
    "-y",
    "-i",
    `${tmp}/booked.png`,
    "-i",
    `${tmp}/mail.png`,
    "-filter_complex",
    SPLIT_FILTER,
    "-frames:v",
    "1",
    poster,
  ])
  const bookLen = (await duration(p.bookVideo)) - p.bookTrim
  const mailLen = (await duration(p.mailVideo)) - p.mailTrim
  const norm =
    `fps=${FPS},scale=${VIEWPORT.width}:${VIEWPORT.height},setsar=1,format=yuv420p`
  const filter = [
    `[0:v]trim=start=${p.bookTrim.toFixed(2)},setpts=PTS-STARTPTS,${norm}[a]`,
    `[1:v]trim=start=${p.mailTrim.toFixed(2)},setpts=PTS-STARTPTS,${norm}[b]`,
    `[2:v]${norm},trim=duration=${POSTER_HOLD}[c]`,
    `[a][b]xfade=transition=fade:duration=${FADE}:offset=${
      (bookLen - FADE).toFixed(2)
    }[ab]`,
    `[ab][c]xfade=transition=fade:duration=${FADE}:offset=${
      (bookLen + mailLen - 2 * FADE).toFixed(2)
    }[v]`,
  ].join(";")
  const joined = `${tmp}/joined.mkv`
  await must("ffmpeg", [
    "-y",
    "-i",
    p.bookVideo,
    "-i",
    p.mailVideo,
    "-loop",
    "1",
    "-t",
    String(POSTER_HOLD + 1),
    "-i",
    poster,
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "ffv1",
    joined,
  ])
  await must("ffmpeg", [
    "-y",
    "-i",
    joined,
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "38",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    "2",
    "-pix_fmt",
    "yuv420p",
    join(OUT, "demo.webm"),
  ])
  await must("ffmpeg", [
    "-y",
    "-i",
    joined,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "26",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    join(OUT, "demo.mp4"),
  ])
  await must("ffmpeg", [
    "-y",
    "-i",
    poster,
    "-c:v",
    "libwebp",
    "-quality",
    "85",
    join(OUT, "poster.webp"),
  ])
  await must("ffmpeg", [
    "-y",
    "-i",
    poster,
    "-vf",
    "scale=640:-1:flags=lanczos",
    "-c:v",
    "libwebp",
    "-quality",
    "85",
    join(OUT, "poster-640.webp"),
  ])
  for (const f of ["demo.webm", "demo.mp4", "poster.webp", "poster-640.webp"]) {
    const { size } = await Deno.stat(join(OUT, f))
    console.log(
      `wrote static/video/tools/mig/${f} (${(size / 1024).toFixed(0)} KB)`,
    )
  }
}

/** "You're booked" on the left, the email on the right, an Ink gap between. */
const SPLIT_FILTER = `[0:v]pad=${
  HALF.width + 8
}:${HALF.height}:0:0:color=${INK}[l];[l][1:v]hstack`

if (import.meta.main) {
  await main()
}
