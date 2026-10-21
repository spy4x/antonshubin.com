// /tools/zond (#462) in a browser: the shared frame check, and "Ask zond"
// walked through every combination of the three answers and five requests,
// with JavaScript on and off, against zond's documented contract
// (docs/api.md, internal/probe/probe.go). Needs a built site and Chromium;
// see docs/testing.md "Browser-driven tests".
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, newPage } from "../browser.ts"
import { toolPageProblems } from "../tool-frame.ts"

const SERVICES = ["metube", "ollama", "grafana"]
const ANSWERS = ["ok", "redirect", "notfound", "error", "timeout", "refused"]
const REQUESTS = ["metube", "ollama", "grafana", "all", "jellyfin"]
const STATUS = {
  200: "HTTP/1.1 200 OK",
  404: "HTTP/1.1 404 Not Found",
  503: "HTTP/1.1 503 Service Unavailable",
}

/** zond's contract: 2xx and 3xx are up; any other status or any error is down. */
const isUp = (answer: string) => answer === "ok" || answer === "redirect"

/** The status line and body zond sends for `request` when the services answer `answers`. */
function expected(answers: string[], request: string): string[] {
  const path = request === "all" ? "/health" : `/health/${request}`
  const head = [`$ curl -i https://zond.example.com${path}`]
  const type = "Content-Type: text/plain; charset=utf-8"
  if (request === "jellyfin") {
    return [...head, STATUS[404], type, "", "unknown target: jellyfin"]
  }
  if (request === "all") {
    const status = answers.every(isUp) ? STATUS[200] : STATUS[503]
    const lines = SERVICES.map((s, i) =>
      `${isUp(answers[i]) ? "OK" : "KO"} ${s}`
    )
    return [...head, status, type, "", ...lines]
  }
  const up = isUp(answers[SERVICES.indexOf(request)])
  return [
    ...head,
    up ? STATUS[200] : STATUS[503],
    type,
    "",
    up ? "ok" : "unreachable",
  ]
}

/** Every combination's visible answer, read in the page, keyed `answers|request`. */
function readAll(page: Page): Promise<Record<string, string[]>> {
  return page.evaluate(
    ({ services, answers, requests }) => {
      const out: Record<string, string[]> = {}
      const combos: string[][] = [[]]
      for (const _ of services) {
        combos.splice(
          0,
          combos.length,
          ...combos.flatMap((c) => answers.map((a) => [...c, a])),
        )
      }
      for (const combo of combos) {
        services.forEach((s, i) => {
          ;(document.getElementById(`zond-a-${s}`) as HTMLSelectElement).value =
            combo[i]
        })
        for (const q of requests) {
          ;(document.getElementById(`zond-q-${q}`) as HTMLInputElement)
            .checked = true
          const shown = [
            ...document.querySelectorAll<HTMLElement>("[data-resp]"),
          ]
            .filter((el) => el.offsetParent !== null)
          const code = shown.map((el) => el.querySelector("code")!.innerText)
            .join("|")
          out[`${combo.join(",")}|${q}`] = code.replace(/\n$/, "").split("\n")
        }
      }
      return out
    },
    { services: SERVICES, answers: ANSWERS, requests: REQUESTS },
  )
}

/** The lines of every combination that differ from the contract, as readable strings. */
async function wrongAnswers(page: Page): Promise<string[]> {
  const seen = await readAll(page)
  const wrong: string[] = []
  for (const [key, lines] of Object.entries(seen)) {
    const [combo, request] = key.split("|")
    const want = expected(combo.split(","), request)
    if (JSON.stringify(lines) !== JSON.stringify(want)) {
      wrong.push(`${key}: ${JSON.stringify(lines)} != ${JSON.stringify(want)}`)
    }
  }
  assertEquals(Object.keys(seen).length, 6 ** 3 * 5, "combinations walked")
  return wrong
}

Deno.test("/tools/zond passes the shared tool page check", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    assertEquals(await toolPageProblems(page, site.origin, "/tools/zond"), [])
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Ask zond prints the contract's answer for every combination, with JavaScript on and off", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const javaScriptEnabled of [true, false]) {
      const page = await newPage(browser, { javaScriptEnabled })
      await page.goto(`${site.origin}/tools/zond`)
      assertEquals(
        await wrongAnswers(page),
        [],
        `wrong answers with JavaScript ${javaScriptEnabled ? "on" : "off"}`,
      )
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Ask zond's first answer is a 503 with grafana KO, and the keyboard changes an answer and the request", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    await page.goto(`${site.origin}/tools/zond`)
    const answer = () =>
      page.locator("[data-resp]").filter({ visible: true }).locator(
        ":scope > code",
      )
        .innerText().then((
          t,
        ) => t.trim().split("\n"))
    assertEquals(await answer(), expected(["ok", "redirect", "error"], "all"))
    assertEquals(
      await page.locator("[data-resp]").filter({ visible: true }).locator(
        "[data-if]",
      ).filter({ visible: true })
        .last()
        .innerText(),
      "One service down makes /health answer 503.",
    )

    // grafana: "500 Server error" → "No answer within its timeout (3000 ms)".
    await page.focus("#zond-a-grafana")
    await page.keyboard.press("ArrowDown")
    assertEquals(await page.inputValue("#zond-a-grafana"), "timeout")
    // /health → /health/jellyfin is the next radio in the group.
    await page.focus("#zond-q-all")
    await page.keyboard.press("ArrowRight")
    assertEquals(
      await answer(),
      expected(["ok", "redirect", "timeout"], "jellyfin"),
    )
    await page.keyboard.press("ArrowLeft")
    await page.keyboard.press("ArrowLeft")
    assertEquals(
      await answer(),
      expected(["ok", "redirect", "timeout"], "grafana"),
    )
    assertEquals(
      await page.locator("[data-resp]").filter({ visible: true }).locator(
        "[data-if]",
      ).filter({ visible: true })
        .last()
        .innerText(),
      "Any error, a timeout or a refused connection, counts as down.",
    )
  } finally {
    await browser?.close()
    await site.stop()
  }
})
