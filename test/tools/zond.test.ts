// /tools/zond (#462): the shared frame, the diagram, "Ask zond" and the
// README's quick start, checked against the built site.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { pageBody, visibleText } from "../html.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { tool } from "../../lib/tools.ts"

const zond = tool("zond")

Deno.test("/tools/zond keeps the frame and shows the diagram, Ask zond and the quick start in that order", async () => {
  const site = await startSite()
  try {
    const html = await site.html("/tools/zond")
    assertToolFrame(zond, html)
    const page = pageBody(html)

    const h2s = [...page.matchAll(/<h2 id="(problem|ask-zond|quick-start)"/g)]
      .map((m) => m[1])
    assertEquals(h2s, ["problem", "ask-zond", "quick-start"])

    const diagram = page.match(
      /<img[^>]*src="\/img\/tools\/zond\/diagram\.svg[?"][^>]*>/,
    )
    assert(diagram, "no diagram")
    assert(diagram[0].includes('loading="lazy"'), "the diagram loads eagerly")
    assert(
      diagram[0].includes('alt="You reach metube through the SSO proxy.'),
      "diagram alt",
    )

    const text = visibleText(page)
    for (
      const line of [
        "image: ghcr.io/spy4x/zond:latest",
        'volumes: ["./zond.yml:/app/zond.yml:ro,z"]',
        "docker compose up -d && curl http://localhost:8080/health/metube",
        'url: "https://zond.example.com/health/metube"',
        '- "[STATUS] == 200"',
      ]
    ) {
      assert(text.includes(line), `quick start: ${line}`)
    }
    assertEquals(
      [...page.matchAll(
        /data-umami-event="tool-install-copy" data-umami-event-item="zond"/g,
      )]
        .length,
      4,
      "a copy button with tool-install-copy on every quick-start block",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("Ask zond's answer never shows an internal URL and each request radio, not its label, carries tool-try with its path", async () => {
  const site = await startSite()
  try {
    const page = pageBody(await site.html("/tools/zond"))
    const start = page.indexOf("<output")
    const output = page.slice(start, page.indexOf("</output>", start))
    assert(start !== -1 && output.length > 0, "no answer")
    assert(
      !/hl-|:\d{4,5}\/|http:\/\//.test(output),
      "an internal URL in the answer",
    )
    for (
      const path of [
        "/health/metube",
        "/health/ollama",
        "/health/grafana",
        "/health",
        "/health/jellyfin",
      ]
    ) {
      const radio = page.match(
        new RegExp(`<input[^>]*data-umami-event-part="ask:${path}"[^>]*>`),
      )?.[0] ?? ""
      assert(
        radio.includes(
          `data-umami-event="tool-try" data-umami-event-item="zond"`,
        ) &&
          radio.includes(`type="radio"`),
        `tool-try for ${path} is not on its radio`,
      )
    }
    assert(
      !/<label[^>]*data-umami-event=/.test(page),
      "a label carries an event, so one click counts twice",
    )
  } finally {
    await site.stop()
  }
})
