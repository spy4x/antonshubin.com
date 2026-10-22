// Shared helpers for the custom case pages' tests in this folder (#523).
import { assert } from "jsr:@std/assert@^1.0.0"
import { type Site, startSite } from "../harness.ts"

/** Registers a test that gets a running copy of the built site, served with a booking URL. */
export function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    // RFC 2606 host: Book renders only with a booking URL.
    const site = await startSite({
      env: { SCHEDULE_URL: "https://meet.example.com/book" },
    })
    try {
      await fn(site)
    } finally {
      await site.stop()
    }
  })
}

/** Where `marker` first appears in `html`; fails when it is missing. */
export function at(html: string, marker: string): number {
  const i = html.indexOf(marker)
  assert(i > 0, `no ${marker}`)
  return i
}

/** The HTML from the start of the element carrying `marker` to the end of its closing `tag`. */
export function region(html: string, marker: string, tag: string): string {
  const start = html.lastIndexOf("<", at(html, marker))
  return html.slice(start, html.indexOf(`</${tag}>`, start))
}

/** A review paragraph as `visibleText()` prints it: whitespace collapsed. */
export function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}
