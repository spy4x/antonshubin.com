// Guard: the portrait photos ship without EXIF or XMP metadata. The metadata
// named the camera, the editing software and the photographer, and it added
// about 20 KB to the home page's hero image, its Largest Contentful Paint
// element. The ICC colour profile stays: it changes how the colours render.
import { assertEquals } from "jsr:@std/assert@^1.0.0";

/** The four-character chunk ids of a WebP (RIFF) file, in order. */
function webpChunks(bytes: Uint8Array): string[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ids: string[] = [];
  for (let at = 12; at + 8 <= bytes.length;) {
    ids.push(new TextDecoder().decode(bytes.subarray(at, at + 4)));
    const size = view.getUint32(at + 4, true);
    at += 8 + size + (size % 2);
  }
  return ids;
}

for (const name of ["photo-big.webp", "photo-mobile.webp"]) {
  Deno.test(`${name} carries no EXIF or XMP metadata`, async () => {
    const bytes = await Deno.readFile(
      new URL(`../static/img/${name}`, import.meta.url),
    );
    const found = webpChunks(bytes).filter((id) =>
      id === "EXIF" || id === "XMP "
    );
    assertEquals(found, []);
  });
}
