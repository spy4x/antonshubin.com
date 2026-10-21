/**
 * Pages whose islands matter only once a visitor presses something (#456):
 * `/tools` plays a clip or copies a command on a press, and nothing on its
 * first screen needs a script. Fresh announces every island script in a
 * `Link: …; rel="modulepreload"` header, so the browser fetches them beside
 * the stylesheet the first paint waits for; on a slow connection that cost
 * the hub about 250 ms of LCP. Without the header the scripts load when the
 * parser reaches Fresh's boot script at the end of the body.
 */
export const LATE_SCRIPT_PATHS: ReadonlySet<string> = new Set(["/tools"])

/**
 * Removes the `rel="modulepreload"` entries from a `Link` header and keeps
 * any other entry; deletes the header when none is left. Entries are split
 * on the commas between them, which a URL in angle brackets never holds here
 * (Fresh writes `/assets/<name>.js` paths).
 */
export function dropModulePreload(headers: Headers): void {
  const link = headers.get("link")
  if (!link) return
  const kept = link.split(/,\s*(?=<)/).filter((entry) =>
    !/rel="?modulepreload"?/i.test(entry)
  )
  if (kept.length === 0) headers.delete("link")
  else headers.set("link", kept.join(", "))
}
