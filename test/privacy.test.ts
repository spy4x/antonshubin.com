// /privacy says only what the code proves (#301): its line on embedded
// videos matches how the pages load them (#562).
import { assert } from "jsr:@std/assert@^1.0.0"
import { startSite } from "./harness.ts"
import { visibleText } from "./html.ts"

Deno.test("/privacy says a blog post's video loads when you scroll to it, as the lazy iframe does", async () => {
  const site = await startSite()
  try {
    const privacy = visibleText(await site.html("/privacy"))
    assert(
      privacy.includes("loads it from YouTube when you scroll to it"),
      "the blog video line is gone",
    )
    assert(!privacy.includes("as the page opens"), "says it loads on open")
    const post = await site.html(
      "/blog/the-importance-of-code-formatting-with-prettier",
    )
    const iframe = post.match(/<iframe\b[^>]*youtube\.com[^>]*>/)
    assert(iframe, "the post has no YouTube iframe")
    assert(iframe[0].includes('loading="lazy"'), iframe[0])
  } finally {
    await site.stop()
  }
})
