import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { DEMO_FILES, rawUrl, VIDEO_SOURCES } from "./video-sources.ts"
import { tools } from "./tools.ts"

Deno.test("every clip source is pinned to a full commit, never a branch", () => {
  for (const source of VIDEO_SOURCES) {
    assert(
      /^[0-9a-f]{40}$/.test(source.commit),
      `${source.slug}: ${source.commit} is not a full commit`,
    )
  }
})

Deno.test("every tool clip is pulled from its repository's media/demo/", () => {
  for (const tool of tools.filter((t) => t.clip?.video)) {
    const source = VIDEO_SOURCES.find((s) =>
      s.slug === tool.slug && s.files["demo.webm"]
    )
    assert(source, `${tool.slug}: its clip has no entry in VIDEO_SOURCES`)
    for (const name of DEMO_FILES) {
      assertEquals(source.files[name], `media/demo/${name}`, tool.slug)
    }
  }
})

Deno.test("no tool clip is described as silent", () => {
  for (const tool of tools.filter((t) => t.clip)) {
    const { title, caption, poster } = tool.clip!
    for (const text of [title, caption, poster.alt]) {
      assert(
        !/no sound|silent|muted|without sound/i.test(text),
        `${tool.slug}: "${text}"`,
      )
    }
  }
})

Deno.test("rawUrl reads a file at the pinned commit", () => {
  const source = VIDEO_SOURCES.find((s) => s.slug === "mig")!
  assertEquals(
    rawUrl(source, "media/demo/demo.mp4"),
    `https://raw.githubusercontent.com/spy4x/mig/${source.commit}/media/demo/demo.mp4`,
  )
})
