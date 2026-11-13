// #636: /tools/ringmaster is a custom page on the shared tool frame with no
// public repository and no live link. Its hero line says whose machine and
// subscription it runs on, the facts card says it is built on Seed, the band
// says when you can run it yourself and links the Ongoing offer, and it sends
// no visitor to GitHub. Needs a built site; see docs/testing.md.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { startSite } from "../harness.ts"
import { assertToolFrame } from "../tool-frame.ts"
import { pageBody, visibleText } from "../html.ts"
import { findTool } from "../../lib/tools.ts"

const tool = findTool("ringmaster")!

/** The markup from the first `start` to the first `end` after it. */
function slice(page: string, start: string, end: string): string {
  const from = page.indexOf(start)
  assert(from !== -1, `no ${start}`)
  return page.slice(from, page.indexOf(end, from))
}

Deno.test("the Ringmaster page wears the tool frame with its clip, no GitHub link and three hand-picked More tools", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const html = await site.html("/tools/ringmaster")
    assertToolFrame(tool, html)
    const page = pageBody(html)
    assert(page.includes('src="/video/tools/ringmaster/poster.webp'), "poster")
    assert(!page.includes("github.com/spy4x/ringmaster"), "repo link")
    assert(!visibleText(page).includes("View on GitHub"), "View on GitHub")
    const hero = slice(page, "data-tool-hero", "</header>")
    assert(
      visibleText(hero).includes(
        "It runs on my own machine, on my own Claude Code subscription, and only I sign in.",
      ),
      "hero line",
    )
    const more = slice(page, "data-tool-more", "All tools")
    const picks = [...more.matchAll(/href="\/tools\/([^"]+)"/g)].map((m) =>
      m[1]
    )
    assertEquals(picks, ["dotfiles", "seed", "financy"])
  } finally {
    await site.stop()
  }
})

Deno.test("the Ringmaster band says it cannot be installed yet and links the Ongoing offer", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  })
  try {
    const page = pageBody(await site.html("/tools/ringmaster"))
    const band = slice(page, "data-closing-band", "data-tool-more")
    const text = visibleText(band)
    assert(text.includes("Not yet. The source will open under AGPL-3.0"), text)
    assert(!text.includes("The code is on GitHub"), "default yourself line")
    assert(
      text.includes(
        "I set up the same workflow on your team's repositories, with your rules and your budget.",
      ),
      "build line",
    )
    assert(
      /href="\/catalog\/cto-advisory-retainer"[^>]*>See the Ongoing offer</
        .test(band),
      "Ongoing offer link",
    )
  } finally {
    await site.stop()
  }
})

Deno.test("the Ringmaster and Financy facts cards say each is built on Seed, linked to its page", async () => {
  const site = await startSite()
  try {
    for (const slug of ["ringmaster", "financy"]) {
      const page = pageBody(await site.html(`/tools/${slug}`))
      const facts = slice(page, "data-fact-card", "data-tool-fit-row")
      assert(
        /Built on[\s\S]*?<a href="\/tools\/seed"[^>]*>Seed<\/a>, the SaaS starter/
          .test(facts),
        `${slug}: Built on row`,
      )
    }
  } finally {
    await site.stop()
  }
})
