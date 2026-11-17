// #465: /tools/caldav-tasks-web in a browser: the frame's shared check, and
// "Same file, two apps" lighting exactly the picked field's lines and showing
// only its note, with JavaScript on and off (the switch is CSS on native
// radios). Needs a built site and Chromium; see docs/testing.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "../harness.ts"
import { launchChromium, newPage, WAIT_MS } from "../browser.ts"
import { toolPageProblems } from "../tool-frame.ts"
import { TASK_FIELDS } from "../../components/tools/caldav-tasks-web/data.ts"

/** The task file lines that carry a fill now (the lit ones), in file order. */
function litLines(page: Page): Promise<string[]> {
  return page.$$eval(
    "[data-same-file] pre span",
    (spans) =>
      spans.filter((s) =>
        getComputedStyle(s).backgroundColor !== "rgba(0, 0, 0, 0)"
      ).map((s) => s.textContent ?? ""),
  )
}

/** The ids of the field notes shown now. */
function shownNotes(page: Page): Promise<string[]> {
  return page.$$eval(
    "[data-note]",
    (notes) =>
      notes.filter((n) => getComputedStyle(n).display !== "none")
        .map((n) => n.getAttribute("data-note")!),
  )
}

Deno.test("the caldav-tasks-web page passes the tool page check: no axe violation, sideways scroll or extra h1", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(
        await toolPageProblems(page, site.origin, "/tools/caldav-tasks-web"),
        [],
      )
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

for (const javaScriptEnabled of [true, false]) {
  Deno.test(`picking a field lights only its lines in the task file and shows only its note (JavaScript ${javaScriptEnabled ? "on" : "off"})`, async () => {
    const site = await startSite()
    let browser: Browser | undefined
    try {
      browser = await launchChromium()
      const page = await newPage(browser, {
        javaScriptEnabled,
        viewport: { width: 390, height: 844 },
      })
      try {
        await page.goto(`${site.origin}/tools/caldav-tasks-web`)
        assertEquals(await litLines(page), ["SUMMARY:Buy seeds"])
        assertEquals(await shownNotes(page), ["title"])

        for (const f of TASK_FIELDS) {
          // A person clicks the chip; the radio inside it is visually hidden.
          await page.locator("[data-same-file] label", {
            hasText: new RegExp(`^${f.label}$`),
          }).click({ timeout: WAIT_MS })
          const lit = await litLines(page)
          assertEquals(
            lit.length > 0 &&
              lit.every((l) => f.lines.some((s) => l.startsWith(s))),
            true,
            `${f.id}: lit ${JSON.stringify(lit)}`,
          )
          assertEquals(lit.length, f.id === "reminder" ? 5 : 1, f.id)
          assertEquals(await shownNotes(page), [f.id])
        }
      } finally {
        await page.close()
      }
    } finally {
      await browser?.close()
      await site.stop()
    }
  })
}

Deno.test("Same file, two apps: the file follows the chips at 390px with the note after it, and the note sits under the chips beside the file at 1440px", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${site.origin}/tools/caldav-tasks-web`)
        const box = (selector: string) =>
          page.locator(`[data-same-file] ${selector}`).first().evaluate((
            el,
          ) => el.getBoundingClientRect().toJSON() as DOMRect)
        const chips = await box("fieldset")
        const file = await box("figure")
        const note = await box("[data-note=title]")
        if (width === 390) {
          // Only the section's 24px gap between the chips and the file.
          assert(
            file.top - chips.bottom <= 24.5,
            `${width}: file starts ${
              file.top - chips.bottom
            }px under the chips`,
          )
          assert(
            note.top >= file.bottom,
            `${width}: note top ${note.top}, file bottom ${file.bottom}`,
          )
        } else {
          assert(
            note.top >= chips.bottom && note.right <= file.left,
            `${width}: note ${
              JSON.stringify(note)
            }, chips bottom ${chips.bottom}, file left ${file.left}`,
          )
          assert(
            note.top < file.bottom,
            `${width}: the note sits below the file, not beside it`,
          )
        }
      }
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("What was tested: both tables put the status column at the same x at 390 and 1440px", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${site.origin}/tools/caldav-tasks-web`)
        const lefts = await page.$$eval(
          "section[aria-labelledby=tested] tbody td",
          (cells) => cells.map((c) => c.getBoundingClientRect().left),
        )
        assert(lefts.length > 2, `${width}: ${lefts.length} status cells`)
        for (const left of lefts) {
          assert(
            Math.abs(left - lefts[0]) <= 1,
            `${width}: status cells at ${JSON.stringify(lefts)}`,
          )
        }
      }
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
