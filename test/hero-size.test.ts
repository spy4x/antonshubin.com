// A case page's hero (#523) is the page's one eager image, sized by
// `width`/`height` from `screenshotSize` or `heroSize` so nothing shifts while
// it loads. A wrong size shifts the page, so each is checked against the
// file the browser loads.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { projects } from "../lib/data.ts"
import { heroShot } from "../lib/case-page.ts"

/** Width and height from a PNG's IHDR or a WebP's VP8/VP8L/VP8X header. */
function imageSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const tag = (at: number) =>
    new TextDecoder().decode(bytes.subarray(at, at + 4))
  if (tag(12) === "IHDR") {
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (tag(0) !== "RIFF" || tag(8) !== "WEBP") {
    throw new Error("not a PNG or WebP")
  }
  const chunk = tag(12)
  if (chunk === "VP8X") {
    return {
      width: (bytes[24] | bytes[25] << 8 | bytes[26] << 16) + 1,
      height: (bytes[27] | bytes[28] << 8 | bytes[29] << 16) + 1,
    }
  }
  if (chunk === "VP8 ") {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    }
  }
  if (chunk === "VP8L") {
    const bits = view.getUint32(21, true)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`unknown WebP chunk ${chunk}`)
}

Deno.test("every client project's hero has the width and height of the file browsers load", async () => {
  let checked = 0
  for (const p of projects.freelance) {
    const shot = heroShot(p)
    assert(shot, `${p.slug}: no hero`)
    assert(shot.width && shot.height, `${p.slug}: hero has no size`)
    const file = new URL(`../static${shot.src}`, import.meta.url)
    assertEquals(
      imageSize(await Deno.readFile(file)),
      { width: shot.width, height: shot.height },
      p.slug,
    )
    checked++
  }
  assert(checked > 10, `only ${checked} heroes checked`)
})
