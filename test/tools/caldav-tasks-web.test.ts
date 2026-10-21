// #465: /tools/caldav-tasks-web wears the tool frame and adds its own middle:
// "Same file, two apps" (the made-up Tasks.org task file with its fields lit
// one at a time) and "What was tested", with the page's own events.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { count, pageBody, visibleText } from "../html.ts"
import { tool } from "../../lib/tools.ts"
import {
  fieldOf,
  TASK_FIELDS,
  TASK_FILE,
} from "../../components/tools/caldav-tasks-web/data.ts"

/** The file lines each field must light, as compatibility.md names them. */
const LIT = {
  title: ["SUMMARY:Buy seeds"],
  priority: ["PRIORITY:1"],
  parent: ["RELATED-TO:100200300"],
  order: ["X-APPLE-SORT-ORDER:792512300"],
  reminder: [
    "BEGIN:VALARM",
    "TRIGGER;RELATED=END:PT0S",
    "ACTION:DISPLAY",
    "DESCRIPTION:Default Tasks.org description",
    "END:VALARM",
  ],
}

Deno.test("each field lights exactly its own lines of the task file, and no other line is lit", () => {
  for (const f of TASK_FIELDS) {
    assertEquals(
      TASK_FILE.filter((line) => fieldOf(line) === f.id),
      LIT[f.id],
      f.id,
    )
  }
  const lit = TASK_FILE.filter((line) => fieldOf(line))
  assertEquals(lit.length, Object.values(LIT).flat().length)
})

Deno.test("the caldav-tasks-web page renders the frame, five field chips with Title checked, the task file and the tested tables", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const html = await site.html("/tools/caldav-tasks-web")
    assertToolFrame(tool("caldav-tasks-web"), html)
    const page = pageBody(html)
    const text = visibleText(page)

    // Five radios, Title checked, each sending tool-try with its field.
    assertEquals(count(page, /name="ctw-field"/g), 5)
    assert(
      /id="ctw-field-title"[^>]*\schecked/.test(page),
      "Title not checked",
    )
    for (const f of TASK_FIELDS) {
      assert(
        page.includes(`data-umami-event-part="field:${f.id}"`),
        `${f.id}: no tool-try`,
      )
      assertEquals(
        count(page, new RegExp(`data-line="${f.id}"`, "g")),
        LIT[f.id].length,
        `${f.id}: lines marked`,
      )
      assertEquals(count(page, new RegExp(`data-note="${f.id}"`, "g")), 1)
    }

    // The whole file is on the page, in order, in a focusable, named box.
    const pre = page.match(
      /<pre[^>]*aria-label="Buy seeds.ics"[^>]*>([\s\S]*?)<\/pre>/,
    )
    assert(pre, "no task file")
    assert(pre[0].includes('tabindex="0"'), "the file box is not focusable")
    assertEquals(
      [...pre[1].matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]),
      [...TASK_FILE],
    )

    // What was tested: Radicale tested, Stalwart in daily use, the rest not.
    assertEquals(count(page, /data-tested="Tested"/g), 2)
    assertEquals(count(page, /data-tested="In daily use, not in CI"/g), 1)
    assertEquals(count(page, /data-tested="Untested"/g), 3)

    // The page follows the README: no warning of the old version is left.
    for (const gone of ["lose data", "being rewritten", "Do not install"]) {
      assert(!text.toLowerCase().includes(gone.toLowerCase()), gone)
    }
    assert(
      text.includes("37 s · no sound · demo tasks on a local Radicale"),
      "clip caption",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the caldav-tasks-web page shows the known issue from caldav-tasks-web#119 in Where it stands, linked to that issue", async () => {
  const site = await startSite()
  try {
    const page = pageBody(await site.html("/tools/caldav-tasks-web"))
    const standing = page.match(
      /<section aria-labelledby="standing">([\s\S]*?)<\/section>/,
    )
    assert(standing, "no Where it stands")
    const line = standing[1].match(/<p data-known-issue[^>]*>([\s\S]*?)<\/p>/)
    assert(line, "no known-issue line in Where it stands")
    const text = visibleText(line[1])
    assert(text.startsWith("Known issue"), text)
    assert(
      text.includes(
        "two offline edits made from the same stale copy, or a task deleted on another device while you edit it",
      ),
      text,
    )
    assert(
      /<a href="https:\/\/github\.com\/spy4x\/caldav-tasks-web\/issues\/119"[^>]*data-umami-event="outbound"[^>]*>Issue #119<\/a>/
        .test(line[1]),
      "no outbound link to #119",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the field switch's rules are in one style element on the caldav-tasks-web page and never in the shared stylesheet", async () => {
  const site = await startSite()
  try {
    const home = await site.html("/")
    const cssHref = home.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1]
    assert(cssHref, "no shared stylesheet linked from /")
    const css = await site.html(cssHref)
    assert(css.length > 10_000, "the shared stylesheet looks empty")
    assert(!css.includes("ctw-field"), "a ctw-field rule is in the shared CSS")
    assert(!home.includes("ctw-field"), "a ctw-field rule is on /")

    const page = await site.html("/tools/caldav-tasks-web")
    const styles = [...page.matchAll(/<style([^>]*)>([^<]*)<\/style>/g)]
      .filter((m) => m[2].includes("#ctw-field-"))
    assertEquals(styles.length, 1, "one style element for the switch")
    // Fresh sets the nonce itself (a nonce="" in the page is overwritten);
    // test/csp.browser.test.ts finds no violation on this page, and the
    // browser test sees the rules light the lines.
    assert(/\snonce="[^"]+"/.test(styles[0][1]), "the style has no nonce")
    for (const f of TASK_FIELDS) {
      assert(styles[0][2].includes(`#ctw-field-${f.id}:checked`), f.id)
    }
  } finally {
    await site.stop()
  }
})
