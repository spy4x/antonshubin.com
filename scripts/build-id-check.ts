/**
 * Post-deploy check that the server and the client bundle share one build id
 * (#593).
 *
 * Fresh appends `?__frsh_c=<build id>` to asset URLs in the server's HTML and
 * bakes the same id into the client bundle, where hydration rewrites `src` and
 * `srcset` with it. When the two differ, every hydrated image downloads twice.
 * Fresh picks a random id when the build has no git and no id in its env, so
 * the Dockerfile passes `BUILD_ID` in as `DENO_DEPLOYMENT_ID`, and this check
 * proves on the live site that it worked.
 *
 * Unlike the Cloudflare purge, this check fails closed: the site itself is the
 * thing being checked, so an unreachable page fails the deploy too.
 */

/** How long one read of the page or the client script may take. */
export const CHECK_TIMEOUT_MS = 10_000

/** The page the check reads: it renders islands and versioned images. */
export const CHECK_PATH = "/tools"

/** What the check reads out of a server-rendered page. */
export interface PageIds {
  /** Every distinct `__frsh_c` value on the page. */
  assetIds: string[]
  /** The path of the client entry script, such as `/assets/client-entry-X.js`. */
  clientEntry?: string
}

/** Reads the asset cache ids and the client entry script path out of a page. */
export function readPage(html: string): PageIds {
  const assetIds = new Set(
    Array.from(html.matchAll(/__frsh_c=([A-Za-z0-9_-]+)/g), (m) => m[1]),
  )
  const clientEntry = html.match(/\/assets\/client-entry-[A-Za-z0-9_-]+\.js/)
    ?.[0]
  return { assetIds: [...assetIds], clientEntry }
}

/**
 * Compares the page's asset ids and the client script against `buildId`.
 * Returns a message naming the ids that differ, or undefined when all match.
 */
export function buildIdProblem(
  buildId: string,
  page: PageIds,
  script: string | undefined,
): string | undefined {
  if (page.assetIds.length === 0) {
    return "the page has no __frsh_c asset id"
  }
  const wrong = page.assetIds.filter((id) => id !== buildId)
  if (wrong.length > 0) {
    return `the page's __frsh_c is ${wrong.join(", ")}, expected ${buildId}`
  }
  if (!page.clientEntry) return "the page links no client-entry script"
  if (script === undefined || !script.includes(`"${buildId}"`)) {
    return `${page.clientEntry} does not carry the build id "${buildId}"`
  }
  return undefined
}

/** Fetches `url` as text with a timeout; throws on a network error or non-2xx. */
async function fetchText(
  url: string,
  fetch: typeof globalThis.fetch,
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) {
    await res.body?.cancel()
    throw new Error(`${url} answered ${res.status}`)
  }
  return await res.text()
}

/**
 * Reads {@link CHECK_PATH} on `domain` and its client entry script, and throws
 * unless both carry `buildId`. Network failures throw too.
 */
export async function checkLiveBuildId(
  domain: string,
  buildId: string,
  fetch: typeof globalThis.fetch = globalThis.fetch,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<void> {
  // A query string of its own keeps this read out of Cloudflare's cached copy.
  const html = await fetchText(
    `https://${domain}${CHECK_PATH}?deploy-check=${Date.now()}`,
    fetch,
    timeoutMs,
  )
  const page = readPage(html)
  const script = page.clientEntry
    ? await fetchText(`https://${domain}${page.clientEntry}`, fetch, timeoutMs)
    : undefined
  const problem = buildIdProblem(buildId, page, script)
  if (problem) {
    throw new Error(
      `Build id check failed on https://${domain}${CHECK_PATH}: ${problem}. ` +
        "Server and client disagree, so hydrated images download twice (#593).",
    )
  }
}
