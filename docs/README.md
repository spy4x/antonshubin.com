# Docs

How antonshubin.com is built, deployed and published. `AGENTS.md` at the repo
root holds the code structure, tasks and conventions.

- [Design brief](design/brief.md): who the site is for, its job, voice, brand
  and the reference products every design role reads first.
- [Deploy](deploy.md): deploy to the cloudlab host, the Cloudflare purge,
  subscriber data, env files and the age key.
- [Publishing a blog post](publishing.md): from idea to a live post, then the
  Dev.to article and the newsletter, both sent automatically. The voice to write
  in is in [voice.md](voice.md).
- [Tagged links](utm.md): the UTM channel table shared with `scripts/utm.ts`,
  campaign names and posting windows (`deno task links`).
- [Analytics](analytics.md): the Umami events, properties and saved reports.
- [Newsletter](newsletter.md): the subscriber data format and endpoints, the
  mailing-list code and outgoing mail.
- [Weekly numbers](weekly-numbers.md): the Sunday report and its env values.
- [Video kit](video-kit.md): titles, description, chapters and a blog draft from
  a transcript.
- [AI crawlers](seo-ai-crawlers.md): llms.txt, llms-full.txt, sitemap, robots,
  the JSON-LD graph, and what to update when a page changes.
- [Catalog and prices](catalog.md): `lib/catalog.ts`, the only place a catalog
  title or price is written.
- [Proof, promises, testimonials and notes](proof.md): the `lib/*.ts` files that
  hold each category of claim.
- [Tools registry](tools-registry.md): `lib/tools.ts`, the GitHub snapshot and
  the hourly refresh.
- [Testing and CI](testing.md): the Woodpecker pipeline, rendered-page tests and
  browser-driven tests.
- [Content-Security-Policy](csp.md): how the policy and its nonce are built.
- [Cache-Control headers](cache-control.md): the cache tiers.
- [Redirect table](redirects.md): the one 301 table.
- [Images](images.md): OG link-preview images, project screenshots and image
  metadata.
