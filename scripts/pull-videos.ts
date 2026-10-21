/**
 * Copies every tool clip from its own repository at its pinned commit
 * (`lib/video-sources.ts`) into `static/video/tools/<slug>/` (#521).
 *
 *   deno task pull:videos
 *
 * Idempotent: a file whose bytes already match is left alone, and a changed
 * one is written to a temporary name and renamed, so an interrupted run never
 * leaves half a video. Any answer other than 200 stops the run with the URL.
 */
import {
  rawUrl,
  VIDEO_SOURCES,
  type VideoSource,
} from "../lib/video-sources.ts"

/** What happened to one file. */
export interface PullResult {
  path: string
  status: "written" | "unchanged"
}

async function readOrNull(path: string): Promise<Uint8Array | null> {
  try {
    return await Deno.readFile(path)
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null
    throw error
  }
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i])
}

/** Downloads each source's files into `<root>/<slug>/<name>`. */
export async function pullVideos(
  sources: readonly VideoSource[],
  root: string,
  fetchFile: typeof fetch = fetch,
): Promise<PullResult[]> {
  const results: PullResult[] = []
  for (const source of sources) {
    const dir = `${root}/${source.slug}`
    await Deno.mkdir(dir, { recursive: true })
    for (const [name, path] of Object.entries(source.files)) {
      const url = rawUrl(source, path)
      const response = await fetchFile(url)
      if (response.status !== 200) {
        await response.body?.cancel()
        throw new Error(`${url} answered ${response.status}`)
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      const target = `${dir}/${name}`
      const current = await readOrNull(target)
      if (current && sameBytes(current, bytes)) {
        results.push({ path: target, status: "unchanged" })
        continue
      }
      const temporary = `${target}.part`
      await Deno.writeFile(temporary, bytes)
      await Deno.rename(temporary, target)
      results.push({ path: target, status: "written" })
    }
  }
  return results
}

if (import.meta.main) {
  const root = new URL("../static/video/tools", import.meta.url).pathname
  for (const { path, status } of await pullVideos(VIDEO_SOURCES, root)) {
    console.log(`${status.padEnd(9)} ${path.slice(root.length + 1)}`)
  }
}
