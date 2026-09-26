/**
 * Strips metadata from the committed images: the tools that made them left
 * camera and software names, creation dates, a local file path and app build
 * ids behind, which every visitor downloads and nobody sees.
 *
 * Only whole metadata chunks are removed. Pixel data, transparency and colour
 * information (ICC profiles, gamma, chromaticity, sRGB) are copied byte for
 * byte, so an image looks exactly as before.
 *
 *   deno task strip-metadata            # every tracked file under static/ and assets/
 *   deno task strip-metadata <file>...  # only these files
 *
 * `test/asset-metadata.test.ts` fails when a tracked image still carries any
 * of it, so a new asset gets stripped before it merges.
 */

const decoder = new TextDecoder("latin1");

/** PNG chunks that carry text, dates or EXIF — never needed to render. */
export const PNG_METADATA_CHUNKS = new Set([
  "tEXt",
  "zTXt",
  "iTXt",
  "tIME",
  "eXIf",
]);

/** WebP chunks that carry EXIF or XMP, with the VP8X flag bit each one sets. */
export const WEBP_METADATA_CHUNKS = new Map([["EXIF", 0x08], ["XMP ", 0x04]]);

/** A chunk's four-character id and its bytes, header and padding included. */
export interface Chunk {
  id: string;
  bytes: Uint8Array;
}

/** The chunks of a PNG, in order, after its 8-byte signature. */
export function pngChunks(png: Uint8Array): Chunk[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: Chunk[] = [];
  for (let at = 8; at + 12 <= png.length;) {
    const size = view.getUint32(at);
    const end = at + 12 + size;
    if (end > png.length) {
      throw new Error(`PNG chunk at byte ${at} runs past the end of the file`);
    }
    chunks.push({
      id: decoder.decode(png.subarray(at + 4, at + 8)),
      bytes: png.subarray(at, end),
    });
    at = end;
  }
  return chunks;
}

/** The chunks of a WebP (RIFF) file, in order, after its 12-byte header. */
export function webpChunks(webp: Uint8Array): Chunk[] {
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const chunks: Chunk[] = [];
  for (let at = 12; at + 8 <= webp.length;) {
    const size = view.getUint32(at + 4, true);
    const end = at + 8 + size + (size % 2);
    if (end > webp.length) {
      throw new Error(`WebP chunk at byte ${at} runs past the end of the file`);
    }
    chunks.push({
      id: decoder.decode(webp.subarray(at, at + 4)),
      bytes: webp.subarray(at, end),
    });
    at = end;
  }
  return chunks;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The PNG without its text, time and EXIF chunks. Every other chunk is kept as is. */
export function stripPng(png: Uint8Array): Uint8Array {
  const kept = pngChunks(png).filter((c) => !PNG_METADATA_CHUNKS.has(c.id));
  return concat([png.subarray(0, 8), ...kept.map((c) => c.bytes)]);
}

/**
 * The WebP without its EXIF and XMP chunks. The VP8X header's flags for them
 * are cleared and the RIFF size is rewritten; every other chunk is kept as is.
 */
export function stripWebp(webp: Uint8Array): Uint8Array {
  const kept = webpChunks(webp)
    .filter((c) => !WEBP_METADATA_CHUNKS.has(c.id))
    .map((c) => {
      if (c.id !== "VP8X") return c.bytes;
      const copy = c.bytes.slice();
      for (const bit of WEBP_METADATA_CHUNKS.values()) copy[8] &= ~bit;
      return copy;
    });
  const out = concat([webp.subarray(0, 12), ...kept]);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}

/** Editor comments ("Generator: Adobe Illustrator …") and `<metadata>` blocks. */
export const SVG_METADATA = [
  /<!--\s*Generator:[\s\S]*?-->\s*/g,
  /<metadata[\s\S]*?<\/metadata>\s*/g,
];

/** The SVG without editor generator comments and `<metadata>` blocks. */
export function stripSvg(svg: string): string {
  return SVG_METADATA.reduce((text, re) => text.replace(re, ""), svg);
}

/** Strips one file in place. Returns the bytes saved, 0 when it had none. */
export async function stripFile(path: string): Promise<number> {
  const before = await Deno.readFile(path);
  let after: Uint8Array;
  if (path.endsWith(".png")) after = stripPng(before);
  else if (path.endsWith(".webp")) after = stripWebp(before);
  else if (path.endsWith(".svg")) {
    after = new TextEncoder().encode(
      stripSvg(new TextDecoder().decode(before)),
    );
  } else return 0;
  if (after.length === before.length) return 0;
  await Deno.writeFile(path, after);
  return before.length - after.length;
}

async function trackedAssets(): Promise<string[]> {
  const { stdout } = await new Deno.Command("git", {
    args: ["ls-files", "static", "assets"],
  })
    .output();
  return new TextDecoder().decode(stdout).trim().split("\n").filter(Boolean);
}

if (import.meta.main) {
  const files = Deno.args.length > 0 ? Deno.args : await trackedAssets();
  let total = 0;
  for (const file of files) {
    const saved = await stripFile(file);
    if (saved > 0) console.log(`${file}  -${saved} B`);
    total += saved;
  }
  console.log(`stripped ${total} B`);
}
