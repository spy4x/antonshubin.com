// #458: /tools/preact-components in a browser: the shared page checks (axe,
// no sideways scroll, one h1 at 390 and 1440px), and the section's code opens
// from the keyboard with nothing for axe to find, and the theme preview
// switches by keyboard with scripts off. #522: the palette demo works from
// the keyboard. Needs a built site and Chromium; see docs/testing.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Page } from "playwright"
import { startSite } from "../harness.ts"
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "../browser.ts"
import { axeViolations, toolPageProblems } from "../tool-frame.ts"

const PATH = "/tools/preact-components"

Deno.test("the preact-components page has no axe violation, sideways scroll or extra h1 at 390 and 1440px", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      assertEquals(await toolPageProblems(page, site.origin, PATH), [])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Show the code opens from the keyboard at 390px, and the open code fits the page and passes axe", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
      const summary = page.locator("[data-palette-code] summary")
      await summary.focus({ timeout: WAIT_MS })
      await page.keyboard.press("Enter")
      const code = page.locator("[data-palette-code] pre")
      await code.waitFor({ state: "visible", timeout: WAIT_MS })
      assert(
        (await code.textContent())?.includes("<CommandPalette"),
        "the open code is not the palette's",
      )
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      )
      assertEquals(overflow, 0, "the open code scrolls the page sideways")
      assertEquals(await axeViolations(page), [])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

/** The value of the focused radio, read by a selector so it works with scripts off. */
async function focusedRadio(page: Page): Promise<string | null> {
  const focused = page.locator("input[name=pc-theme]:focus")
  return await focused.count() ? await focused.getAttribute("value") : null
}

/** The preview frame's colours and the page's background, as computed. */
function previewColours(page: Page) {
  return page.evaluate(() => {
    const frame = getComputedStyle(
      document.querySelector("[data-preview-frame]")!,
    )
    return {
      frame: `${frame.backgroundColor} / ${frame.color}`,
      page: getComputedStyle(document.body).backgroundColor,
    }
  })
}

Deno.test("with scripts off, the search is disabled and says it needs JavaScript, and the preview's Dark and Light radios are one tab stop whose arrow keys repaint only the frame", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    })
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "load" })
      const dark = await previewColours(page)
      assert(
        await page.locator("[data-palette-demo] [aria-haspopup=dialog]")
          .isDisabled(),
        "the search trigger is live with scripts off",
      )
      const noscript = page.locator("[data-palette-noscript]")
      assert(await noscript.isVisible(), "the no-script line is hidden")
      assert(
        (await noscript.innerText()).startsWith(
          "The search needs JavaScript.",
        ),
        "no line says the search needs JavaScript",
      )

      // Tab reaches the checked radio from the control before it, and the
      // next Tab leaves the pair.
      await page.locator("input[name=pc-theme][value=dark]").focus()
      await page.keyboard.press("Shift+Tab")
      assertEquals(
        await focusedRadio(page),
        null,
        "Shift+Tab stayed in the pair",
      )
      await page.keyboard.press("Tab")
      assertEquals(await focusedRadio(page), "dark")
      await page.keyboard.press("Tab")
      // The disabled search and examples take no stop; the no-script link does.
      assertEquals(
        await page.locator("[data-palette-noscript] a:focus").count(),
        1,
        "Tab did not leave the pair for the no-script link",
      )
      await page.keyboard.press("Shift+Tab")
      await page.keyboard.press("ArrowRight")
      assertEquals(await focusedRadio(page), "light")
      assert(
        await page.locator("input[name=pc-theme][value=light]").isChecked(),
        "the arrow key did not check Light",
      )
      const light = await previewColours(page)
      assert(light.frame !== dark.frame, "Light did not repaint the frame")
      assertEquals(light.page, dark.page, "Light repainted the page")

      await page.keyboard.press("ArrowLeft")
      assertEquals(await previewColours(page), dark, "Dark did not come back")
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("Light repaints the preview's frame and not the page, and axe finds nothing in either state", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
      const colours = () =>
        page.evaluate(() => ({
          frame: getComputedStyle(
            document.querySelector("[data-preview-frame]")!,
          ).backgroundColor,
          page: getComputedStyle(document.body).backgroundColor,
        }))
      const dark = await colours()
      assertEquals(await axeViolations(page), [], "dark preview")
      await page.locator("input[name=pc-theme][value=light]").check({
        force: true,
      })
      // The library's buttons fade their colours; axe must see the end state.
      await page.waitForFunction(() => document.getAnimations().length === 0)
      const light = await colours()
      assert(light.frame !== dark.frame, "Light did not repaint the frame")
      assertEquals(light.page, dark.page, "Light repainted the page")
      assertEquals(await axeViolations(page), [], "light preview")
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("at 390px the first screen shows the h1, the lede and at least half of the clip's poster, and no clip bytes load before the press", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 390, height: 844 },
    })
    try {
      const videos: string[] = []
      page.on("request", (request) => {
        if (/\.(webm|mp4)(\?|$)/.test(request.url())) {
          videos.push(request.url())
        }
      })
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
      // The page's four-line h1 leaves room for most of the poster, not all.
      for (
        const [selector, share] of [
          ["h1", 1],
          ["[data-tool-lede]", 1],
          ["[data-tool-media] img", 0.5],
        ] as const
      ) {
        const box = await page.locator(selector).first().boundingBox()
        assert(box, `${selector} is not drawn`)
        assert(
          box.y + box.height * share <= 844,
          `${selector} is not on the first screen`,
        )
      }
      assertEquals(videos, [], "the clip loaded before the press")
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

/** The search's trigger, once the island has enabled its fieldset. */
async function liveTrigger(page: Page) {
  const trigger = page.locator("[data-palette-demo] [aria-haspopup=dialog]")
  await page.waitForFunction(
    () =>
      // The server render disables the fieldset, not the button.
      document.querySelector(
        "[data-palette-demo] [aria-haspopup=dialog]:enabled",
      ) !== null,
    undefined,
    { timeout: WAIT_MS },
  )
  return trigger
}

/** Waits for the open palette to list `label` first. */
async function firstResult(page: Page, label: string) {
  await page.locator("dialog[open] [role=option]").first().filter({
    hasText: label,
  }).waitFor({ timeout: WAIT_MS })
}

Deno.test("Ctrl K and / open the palette, Escape closes it back on the field, and each example puts its component on the stage with why it matched", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await recordUmami(page)
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
      await liveTrigger(page)
      const dialog = page.locator("dialog[open]")

      for (const keys of ["Control+k", "/"]) {
        // Off the field: a key typed on the focused trigger opens it too.
        await page.evaluate(() =>
          (document.activeElement as HTMLElement)?.blur()
        )
        await page.keyboard.press(keys)
        await dialog.waitFor({ timeout: WAIT_MS })
        await page.keyboard.press("Escape")
        await dialog.waitFor({ state: "detached", timeout: WAIT_MS })
        // The dialog's close event, which moves focus, runs after `open` goes.
        await page.waitForFunction(
          () =>
            document.activeElement ===
              document.querySelector(
                "[data-palette-demo] [aria-haspopup=dialog]",
              ),
          undefined,
          { timeout: WAIT_MS },
        ).catch(() => {
          throw new Error(`${keys}: Escape did not put focus back on the field`)
        })
      }

      const examples: [string, string, string][] = [
        ["typo", "Combobox", "Matched “combobx” through a typo."],
        [
          "order",
          "DateRangePicker",
          "Matched “picker date” through words in any order.",
        ],
        [
          "layout",
          "Toastr",
          "Matched “ещфые” through the wrong keyboard layout.",
        ],
        ["cyrillic", "Toastr", "Matched “тост” through Cyrillic and a typo."],
      ]
      for (const [part, name, reason] of examples) {
        await page.locator(`[data-palette-example=${part}]`).focus()
        await page.keyboard.press("Enter")
        await firstResult(page, name)
        await page.keyboard.press("Enter")
        await dialog.waitFor({ state: "detached", timeout: WAIT_MS })
        const stage = page.locator("[data-palette-stage=filled]")
        assertEquals(await stage.locator("h3").textContent(), name, part)
        assertEquals(
          await stage.locator("[data-palette-reason]").textContent(),
          reason,
        )
        assert(
          (await page.locator("[data-palette-demo] [role=status]").last()
            .textContent())?.startsWith(`${name}, from preact-ui.`),
          `${part}: the pick is not announced`,
        )
      }

      const tried = (await trackedCalls(page))
        .filter(([name]) => name === "tool-try")
        .map(([, data]) => data?.part)
      assertEquals(tried, [
        "palette:open",
        "example:typo",
        "pick:forgiving",
        "example:order",
        "pick:forgiving",
        "example:layout",
        "pick:forgiving",
        "example:cyrillic",
        "pick:forgiving",
      ])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("from the keyboard, Show a toast shows Toastr with a working Undo and Switch the preview to Light repaints only the frame, with nothing for axe to find open or closed at 390 and 1440px in both themes", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    for (const width of [390, 1440]) {
      const page = await newPage(browser, {
        viewport: { width, height: width === 390 ? 844 : 900 },
      })
      try {
        await recordUmami(page)
        await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
        const trigger = await liveTrigger(page)
        const dialog = page.locator("dialog[open]")
        const settled = () =>
          page.waitForFunction(() =>
            document.getAnimations().every((a) => a.playState !== "running")
          )
        assertEquals(await axeViolations(page), [], `${width}: dark, closed`)

        await trigger.focus()
        await page.keyboard.type("show a toast")
        await firstResult(page, "Show a toast")
        await settled()
        assertEquals(await axeViolations(page), [], `${width}: dark, open`)
        await page.keyboard.press("Enter")
        await page.getByText("This is Toastr. It closes by itself.")
          .waitFor({ timeout: WAIT_MS })
        let onUndo = false
        for (let i = 0; i < 20 && !onUndo; i++) {
          await page.keyboard.press("Tab")
          onUndo = await page.evaluate(() =>
            document.activeElement?.textContent === "Undo"
          )
        }
        assert(onUndo, `${width}: Tab never reaches Undo`)
        await page.keyboard.press("Enter")
        await page.getByText("Undone. Nothing changed: it's a demo.")
          .waitFor({ timeout: WAIT_MS })

        const before = await previewColours(page)
        await trigger.focus()
        await page.keyboard.press("Control+k")
        await page.keyboard.type("switch")
        await firstResult(page, "Switch the preview to Light")
        await page.keyboard.press("Enter")
        await dialog.waitFor({ state: "detached", timeout: WAIT_MS })
        assert(
          await page.locator("input[name=pc-theme][value=light]").isChecked(),
          `${width}: Light is not checked`,
        )
        await settled()
        const after = await previewColours(page)
        assert(after.frame !== before.frame, `${width}: the frame kept Dark`)
        assertEquals(after.page, before.page, `${width}: the page repainted`)
        assertEquals(await axeViolations(page), [], `${width}: light, closed`)
        await page.keyboard.press("Control+k")
        await firstResult(page, "Switch the preview to Dark")
        await settled()
        assertEquals(await axeViolations(page), [], `${width}: light, open`)
        await page.keyboard.press("Escape")
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
        assertEquals(overflow, 0, `${width}: the page scrolls sideways`)

        const tried = (await trackedCalls(page))
          .filter(([name]) => name === "tool-try")
          .map(([, data]) => data?.part)
        assertEquals(tried, [
          "palette:open",
          "command:toast",
          "command:undo",
          "command:theme-light",
        ])
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})

Deno.test("a denied clipboard says so in a toast and selects the import line for copying by hand", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    })
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: () => Promise.reject(new Error("denied")) },
        })
        document.execCommand = () => false
      })
      await page.goto(`${site.origin}${PATH}`, { waitUntil: "networkidle" })
      await (await liveTrigger(page)).focus()
      await page.keyboard.type("toastr")
      await firstResult(page, "Toastr")
      await page.keyboard.press("Enter")
      await page.locator("[data-palette-stage=filled] button", {
        hasText: "Copy",
      }).click()
      await page.getByText(
        "Couldn't copy. Select the line and copy it yourself.",
      ).waitFor({ timeout: WAIT_MS })
      const line = page.locator("[data-palette-import]")
      assert(
        await line.evaluate((el) => el === document.activeElement),
        "the import line is not focused",
      )
      assertEquals(
        await page.evaluate(() => getSelection()?.toString()),
        `import { Toastr } from "@spy4x/preact-ui"`,
      )
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
