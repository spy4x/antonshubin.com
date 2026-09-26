// Guard: no committed image carries metadata a visitor downloads and never
// sees — PNG text, time and EXIF chunks, WebP EXIF and XMP chunks, SVG editor
// generator comments and <metadata> blocks. They held camera and software
// names, creation dates, a local file path and app build ids; the hero photo's
// alone was 20 KB of its Largest Contentful Paint image. Colour profiles stay:
// they change how an image renders. Fix a failure with `deno task strip-metadata`.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  PNG_METADATA_CHUNKS,
  pngChunks,
  SVG_METADATA,
  WEBP_METADATA_CHUNKS,
  webpChunks,
} from "../scripts/strip-metadata.ts";

const root = new URL("../", import.meta.url);

/** Every .png, .webp and .svg under static/ and assets/, as root-relative paths. */
async function images(dir = "static"): Promise<string[]> {
  const found: string[] = [];
  for await (const entry of Deno.readDir(new URL(`${dir}/`, root))) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) found.push(...await images(path));
    else if (/\.(png|webp|svg)$/.test(entry.name)) found.push(path);
  }
  return found;
}

Deno.test("no committed image carries metadata", async () => {
  const files = [...await images("static"), ...await images("assets")];
  assertEquals(files.length > 100, true, `found only ${files.length} images`);
  const found: string[] = [];
  for (const file of files) {
    const bytes = await Deno.readFile(new URL(file, root));
    if (file.endsWith(".png")) {
      for (const c of pngChunks(bytes)) {
        if (PNG_METADATA_CHUNKS.has(c.id)) found.push(`${file}: ${c.id}`);
      }
    } else if (file.endsWith(".webp")) {
      for (const c of webpChunks(bytes)) {
        if (WEBP_METADATA_CHUNKS.has(c.id)) found.push(`${file}: ${c.id}`);
      }
    } else {
      const text = new TextDecoder().decode(bytes);
      if (SVG_METADATA.some((re) => new RegExp(re.source).test(text))) {
        found.push(`${file}: editor metadata`);
      }
    }
  }
  assertEquals(found, [], "run `deno task strip-metadata`");
});
