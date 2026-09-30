// Every project screenshot WebP (what browsers load; the PNG is a fallback) is at most MAX_SCREENSHOT_WIDTH wide (#336): the
// lightbox lagged on 2500px CallTrack shots, since decode time follows pixels.
import { assert } from "jsr:@std/assert@^1.0.0";
import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { MAX_SCREENSHOT_WIDTH } from "../lib/image-path.ts";

const DIR = new URL("../static/img/projects/", import.meta.url);

/** Reads the pixel width from a PNG's IHDR or a WebP's VP8/VP8L/VP8X header. */
function imageWidth(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) =>
    new TextDecoder().decode(bytes.subarray(at, at + 4));
  if (tag(12) === "IHDR") return view.getUint32(16);
  if (tag(0) !== "RIFF" || tag(8) !== "WEBP") {
    throw new Error("not a PNG or WebP");
  }
  const chunk = tag(12);
  if (chunk === "VP8X") {
    return (bytes[24] | bytes[25] << 8 | bytes[26] << 16) + 1;
  }
  if (chunk === "VP8 ") return view.getUint16(26, true) & 0x3fff;
  if (chunk === "VP8L") return (bytes[21] | (bytes[22] & 0x3f) << 8) + 1;
  throw new Error(`unknown WebP chunk ${chunk}`);
}

Deno.test("no project screenshot is wider than the lightbox cap", async () => {
  let checked = 0;
  for await (
    const e of walk(DIR, { includeDirs: false, exts: [".webp"] })
  ) {
    const width = imageWidth(await Deno.readFile(e.path));
    assert(
      width <= MAX_SCREENSHOT_WIDTH,
      `${e.path}: ${width}px wide, over ${MAX_SCREENSHOT_WIDTH}. Run deno task optimize:screenshots.`,
    );
    checked++;
  }
  assert(checked > 50, `only ${checked} screenshots found`);
});
