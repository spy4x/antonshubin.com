import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  pngChunks,
  stripPng,
  stripSvg,
  stripWebp,
  webpChunks,
} from "./strip-metadata.ts";

const ascii = (s: string) => new TextEncoder().encode(s);

/** A PNG chunk: big-endian length, id, data, and a CRC the parser doesn't check. */
function pngChunk(id: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  new DataView(out.buffer).setUint32(0, data.length);
  out.set(ascii(id), 4);
  out.set(data, 8);
  return out;
}

/** A RIFF chunk: id, little-endian length, data, and a pad byte when odd. */
function riffChunk(id: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + data.length + (data.length % 2));
  out.set(ascii(id), 0);
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

function join(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) (out.set(p, at), at += p.length);
  return out;
}

Deno.test("stripPng drops text, time and EXIF chunks and keeps the rest byte for byte", () => {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk("IHDR", new Uint8Array(13).fill(1));
  const gama = pngChunk("gAMA", new Uint8Array([0, 0, 177, 143]));
  const idat = pngChunk("IDAT", new Uint8Array([9, 8, 7]));
  const iend = pngChunk("IEND", new Uint8Array());
  const png = join([
    signature,
    ihdr,
    pngChunk("tEXt", ascii("software\0ImageMagick")),
    gama,
    pngChunk("tIME", new Uint8Array(7)),
    idat,
    pngChunk("iTXt", ascii("x")),
    iend,
  ]);
  assertEquals(stripPng(png), join([signature, ihdr, gama, idat, iend]));
  assertEquals(pngChunks(stripPng(png)).map((c) => c.id), [
    "IHDR",
    "gAMA",
    "IDAT",
    "IEND",
  ]);
});

Deno.test("stripWebp drops EXIF and XMP, clears their VP8X flags and fixes the RIFF size", () => {
  const vp8x = new Uint8Array(10);
  vp8x[0] = 0x20 | 0x08 | 0x04; // ICC, EXIF, XMP
  const body = [
    riffChunk("VP8X", vp8x),
    riffChunk("ICCP", new Uint8Array([1, 2, 3])),
    riffChunk("VP8 ", new Uint8Array([4, 5, 6, 7])),
    riffChunk("EXIF", new Uint8Array([8, 9, 10])),
    riffChunk("XMP ", ascii("<x/>")),
  ];
  const header = join([ascii("RIFF"), new Uint8Array(4), ascii("WEBP")]);
  const webp = join([header, ...body]);
  new DataView(webp.buffer).setUint32(4, webp.length - 8, true);

  const out = stripWebp(webp);
  const chunks = webpChunks(out);
  assertEquals(chunks.map((c) => c.id), ["VP8X", "ICCP", "VP8 "]);
  assertEquals(chunks[0].bytes[8], 0x20, "only the ICC flag stays set");
  assertEquals(new DataView(out.buffer).getUint32(4, true), out.length - 8);
  assertEquals(chunks[1].bytes, body[1]);
  assertEquals(chunks[2].bytes, body[2]);
});

Deno.test("stripSvg drops a generator comment and <metadata> but keeps other comments", () => {
  const svg =
    `<?xml version="1.0"?>\n<!-- Generator: Adobe Illustrator 16.0.0 -->\n` +
    `<svg><metadata><rdf:RDF/></metadata><!-- clapper mark --><path d="M0 0"/></svg>`;
  assertEquals(
    stripSvg(svg),
    `<?xml version="1.0"?>\n<svg><!-- clapper mark --><path d="M0 0"/></svg>`,
  );
});
