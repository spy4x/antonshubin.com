// Guards the committed OG link-preview PNGs (#193, scripts/og-images.ts):
// every post and project page needs one, each exactly 1200x630. Reads the
// files directly — deterministic and offline, no server or browser needed,
// so it runs under the narrow `deno task test`, not `deno task test:browser`.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { blogArticles, projects } from "../lib/data.ts";

const OG_ROOT = new URL("../static/img/og/", import.meta.url);

const WIDTH = 1200;
const HEIGHT = 630;
// Soft ceiling above the "aim under ~80KB each" in AGENTS.md/#193 — catches
// a regen that stops compressing well, without being brittle to the exact
// byte count Chromium's PNG encoder happens to produce.
const MAX_BYTES = 150_000;

interface PngInfo {
  width: number;
  height: number;
  bytes: number;
}

/**
 * Reads a PNG's IHDR chunk (signature: 8 bytes, then length+"IHDR"+width+
 * height, big-endian) to get its pixel size, without an image-decoding
 * dependency — the file format guarantees IHDR is the first chunk.
 */
async function pngInfo(relativePath: string): Promise<PngInfo> {
  const url = new URL(relativePath, OG_ROOT);
  let data: Uint8Array;
  try {
    data = await Deno.readFile(url);
  } catch {
    throw new Error(
      `missing OG image: static/img/og/${relativePath} — run \`deno task og\` to generate it`,
    );
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { width, height, bytes: data.byteLength };
}

Deno.test("every blog post has a 1200x630 OG preview PNG", async () => {
  for (const article of blogArticles) {
    const relative = `blog/${article.slug}.png`;
    const { width, height, bytes } = await pngInfo(relative);
    assertEquals(width, WIDTH, `${relative}: width`);
    assertEquals(height, HEIGHT, `${relative}: height`);
    assert(
      bytes < MAX_BYTES,
      `${relative} is ${bytes} bytes, expected under ${MAX_BYTES}`,
    );
  }
});

Deno.test("every project page has a 1200x630 OG preview PNG", async () => {
  const withSlug = [...projects.my, ...projects.freelance].filter((p) =>
    p.slug
  );
  assert(withSlug.length > 0, "no projects with a slug to check");
  for (const project of withSlug) {
    const relative = `projects/${project.slug}.png`;
    const { width, height, bytes } = await pngInfo(relative);
    assertEquals(width, WIDTH, `${relative}: width`);
    assertEquals(height, HEIGHT, `${relative}: height`);
    assert(
      bytes < MAX_BYTES,
      `${relative} is ${bytes} bytes, expected under ${MAX_BYTES}`,
    );
  }
});

Deno.test("the site has a 1200x630 landscape default OG PNG", async () => {
  const relative = "default.png";
  const { width, height, bytes } = await pngInfo(relative);
  assertEquals(width, WIDTH, `${relative}: width`);
  assertEquals(height, HEIGHT, `${relative}: height`);
  assert(
    bytes < MAX_BYTES,
    `${relative} is ${bytes} bytes, expected under ${MAX_BYTES}`,
  );
});
