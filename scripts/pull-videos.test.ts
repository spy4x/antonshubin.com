import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0"
import { pullVideos } from "./pull-videos.ts"
import type { VideoSource } from "../lib/video-sources.ts"

const SOURCE: VideoSource = {
  slug: "demo-tool",
  repo: "demo-tool",
  commit: "0123456789abcdef0123456789abcdef01234567",
  files: { "demo.webm": "media/demo/demo.webm", "a.vtt": "media/demo/a.vtt" },
}

/** A fetch stub that answers each URL from `bodies`, 404 otherwise, and records the URLs. */
function stubFetch(bodies: Record<string, string>) {
  const urls: string[] = []
  const fetch = (input: string | URL | Request) => {
    const url = String(input)
    urls.push(url)
    const body = bodies[url]
    return Promise.resolve(
      body === undefined
        ? new Response("not found", { status: 404 })
        : new Response(body),
    )
  }
  return { urls, fetch: fetch as typeof globalThis.fetch }
}

const RAW = `https://raw.githubusercontent.com/spy4x/demo-tool/${SOURCE.commit}`

Deno.test("pullVideos copies each file from the repository at the pinned commit, then leaves matching files alone", async () => {
  const root = await Deno.makeTempDir()
  try {
    const stub = stubFetch({
      [`${RAW}/media/demo/demo.webm`]: "video bytes",
      [`${RAW}/media/demo/a.vtt`]: "WEBVTT",
    })
    const first = await pullVideos([SOURCE], root, stub.fetch)
    assertEquals(first.map((r) => r.status), ["written", "written"])
    assertEquals(
      await Deno.readTextFile(`${root}/demo-tool/demo.webm`),
      "video bytes",
    )
    assertEquals(await Deno.readTextFile(`${root}/demo-tool/a.vtt`), "WEBVTT")
    assertEquals(stub.urls, [
      `${RAW}/media/demo/demo.webm`,
      `${RAW}/media/demo/a.vtt`,
    ])

    const second = await pullVideos([SOURCE], root, stub.fetch)
    assertEquals(second.map((r) => r.status), ["unchanged", "unchanged"])
    const names = []
    for await (const entry of Deno.readDir(`${root}/demo-tool`)) {
      names.push(entry.name)
    }
    assertEquals(names.sort(), ["a.vtt", "demo.webm"])
  } finally {
    await Deno.remove(root, { recursive: true })
  }
})

Deno.test("pullVideos stops on a missing file and keeps the copy it has", async () => {
  const root = await Deno.makeTempDir()
  try {
    await Deno.mkdir(`${root}/demo-tool`)
    await Deno.writeTextFile(`${root}/demo-tool/demo.webm`, "old clip")
    const stub = stubFetch({})
    await assertRejects(
      () => pullVideos([SOURCE], root, stub.fetch),
      Error,
      `${RAW}/media/demo/demo.webm answered 404`,
    )
    assertEquals(
      await Deno.readTextFile(`${root}/demo-tool/demo.webm`),
      "old clip",
    )
  } finally {
    await Deno.remove(root, { recursive: true })
  }
})
