// #523: /work/smartlite's own middle, checked on the built page: the tour of
// the 12 screens grouped by job as the hero, every step's line in the server
// HTML, "How a click reaches a pole" as four ordered steps, Book exactly
// twice and the project's JSON-LD node.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { count, jsonLd, mainContent, visibleText } from "../html.ts"

/** The built page's HTML, served with a booking URL so Book renders. */
async function pageHtml(): Promise<string> {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    return await site.html("/work/smartlite")
  } finally {
    await site.stop()
  }
}

/** The inner HTML of the element whose tag holds `marker`, up to its first closing `tag`. */
function region(html: string, marker: string, tag: string): string {
  const at = html.indexOf(marker)
  assert(at > 0, `no ${marker}`)
  const start = html.indexOf(">", at) + 1
  return html.slice(start, html.indexOf(`</${tag}>`, start))
}

Deno.test("the SmartLite page has one h1 with its kind line, and Book exactly twice", async () => {
  const html = await pageHtml()
  assertEquals(count(html, /<h1\b/), 1)
  const h1 = visibleText(region(html, "<h1", "h1"))
  assert(h1.startsWith("SmartLite"), h1)
  assert(h1.includes("Real-time IoT control for about 200 lamp poles"), h1)
  assertEquals(count(mainContent(html), /data-primary-book/), 2)
  const node = jsonLd(html).find((d) =>
    (d as { "@id"?: string })["@id"] ===
      "https://antonshubin.com/work/smartlite#project"
  ) as Record<string, unknown> | undefined
  assert(node, "no #project node")
  assertEquals(node["@type"], "CreativeWork")
  assertEquals(node.name, "SmartLite")
})

Deno.test("What an operator sees lists all 12 screens, grouped by job, with their lines in the HTML", async () => {
  const html = await pageHtml()
  const tour = region(html, `aria-labelledby="case-tour"`, "section")
  assert(visibleText(tour).startsWith("What an operator sees"))
  const tabs = [...tour.matchAll(/role="tab"[^>]*>([\s\S]*?)<\/button>/g)]
    .map((m) => visibleText(m[1]))
  assertEquals(tabs, [
    "Dashboard",
    "Alerts",
    "Lampboxes",
    "Gateways",
    "Sensors",
    "Schedules",
    "Zones",
    "Users",
    "Regions",
    "Lamp profiles",
    "Admin settings",
    "Profile",
  ])
  const groups = [
    ...tour.matchAll(/id="smartlite-[a-z-]+-group"[^>]*>([^<]*)</g),
  ]
    .map((m) => m[1])
  assertEquals(groups, ["Monitoring", "Devices", "Automation", "Admin"])
  const text = visibleText(tour)
  for (
    const line of [
      "A geographic map of every pole.",
      "Failure detection with automatic alerts through PWA push, Telegram and WhatsApp.",
      "Pole state and sensor readings, live over MQTT.",
      "Motion and ambient-light triggers.",
      "Scheduled automation: by time of day, triggered by a sensor, or by manual override.",
      "Role-based access and TOTP 2FA.",
      "Some details are blacked out in these screenshots.",
    ]
  ) {
    assert(text.includes(line), line)
  }
  assert(!html.includes("data-gallery-strip"), "a second gallery")
})

Deno.test("How a click reaches a pole is four ordered steps, from the web app over MQTT to every dashboard", async () => {
  const html = await pageHtml()
  const flow = region(html, "data-case-flow", "section")
  assert(visibleText(flow).startsWith("How a click reaches a pole"))
  const steps = [...region(flow, "<ol", "ol").matchAll(/<h3[^>]*>([^<]*)</g)]
    .map((m) => m[1])
  assertEquals(steps, [
    "Operator web app",
    "Backend",
    "Lamp pole",
    "Every open dashboard",
  ])
  const text = visibleText(flow)
  assert(text.includes("over MQTT"), text)
  assert(text.includes("PostgreSQL LISTEN/NOTIFY"), text)
  // The flow comes after the tour and before "What I built".
  const at = (marker: string) => html.indexOf(marker)
  assert(at(`aria-labelledby="case-tour"`) < at("data-case-flow"))
  assert(at("data-case-flow") < at(`id="project-built"`))
})
