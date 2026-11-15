// Guards the length of every non-blog sitemap page's <title> and meta
// description (#494): a search result cuts a title at about 60 characters and
// a description at about 155, so a longer one loses its end. Blog posts keep
// their own rule (`postTitleTag()` in lib/blog.ts) and are left out.
import { assert } from "jsr:@std/assert@^1.0.0"
import { startSite } from "./harness.ts"
import { visibleText } from "./html.ts"
import { META_DESCRIPTION_MAX } from "../lib/home.ts"

/** Characters of a `<title>` before the " — Anton Shubin" suffix. */
const TITLE_MAX = 60
const SUFFIX = " — Anton Shubin"

Deno.test(
  "every non-blog sitemap page has a title of at most 60 characters before the name and a description of at most 155",
  async () => {
    const site = await startSite()
    try {
      const xml = await site.html("/sitemap.xml")
      const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => new URL(m[1]).pathname)
        .filter((p) => !p.startsWith("/blog/"))
      assert(paths.length > 30, `only ${paths.length} pages in the sitemap`)
      const problems: string[] = []
      for (const path of paths) {
        const html = await site.html(path)
        const rawTitle = html.match(/<title>([^<]*)<\/title>/)?.[1]
        const rawDescription = html.match(
          /<meta name="description" content="([^"]*)"/,
        )?.[1]
        assert(rawTitle !== undefined, `${path}: no <title>`)
        assert(rawDescription !== undefined, `${path}: no meta description`)
        const title = visibleText(rawTitle).replace(SUFFIX, "")
        const description = visibleText(rawDescription)
        if (title.length > TITLE_MAX) {
          problems.push(`${path}: title ${title.length}: ${title}`)
        }
        if (description.length > META_DESCRIPTION_MAX) {
          problems.push(
            `${path}: description ${description.length}: ${description}`,
          )
        }
      }
      assert(problems.length === 0, problems.join("\n"))
    } finally {
      await site.stop()
    }
  },
)
