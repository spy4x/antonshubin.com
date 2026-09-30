#!/usr/bin/env -S deno run -A
/**
 * Optimize project screenshots: PNG to WebP, at most `MAX_WIDTH` pixels wide.
 *
 * Run once to regenerate webp variants under static/img/projects/:
 *   deno task optimize:screenshots
 *
 * Idempotent — skips files whose webp output is already newer than the source.
 * A WebP with no PNG source (older projects) is resized in place when it is
 * wider than `MAX_WIDTH`: the browser decodes every pixel before the lightbox
 * paints, so pixel count, not file size, is what makes a big screenshot lag
 * (#336).
 *
 * @jsquash/png, @jsquash/webp and @jsquash/resize are pure-WASM, no native deps.
 */
import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { decode as decodePng } from "https://esm.sh/@jsquash/png@3.0.1?target=denonext&pin=v135";
import {
  decode as decodeWebp,
  encode as encodeWebp,
} from "https://esm.sh/@jsquash/webp@1.5.0?target=denonext&pin=v135";
import resize from "https://esm.sh/@jsquash/resize@2.1.0?target=denonext&pin=v135";
import { MAX_SCREENSHOT_WIDTH as MAX_WIDTH } from "../lib/image-path.ts";

const PROJECT_ROOT = new URL("../", import.meta.url).pathname;
const SCREENSHOTS_DIR = `${PROJECT_ROOT}static/img/projects`;

const WEBP_QUALITY = 75;

interface ProcessedFile {
  input: string;
  output: string;
  bytes: number;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

function asUint8Array(buf: ArrayBuffer | Uint8Array): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
}

async function processPng(pngPath: string): Promise<ProcessedFile | null> {
  const dir = pngPath.substring(0, pngPath.lastIndexOf("/"));
  const base = pngPath.split("/").pop()!.replace(/\.png$/, "");
  const outPath = `${dir}/${base}.webp`;

  // Skip if up-to-date
  try {
    const [pngStat, webpStat] = await Promise.all([
      Deno.stat(pngPath),
      Deno.stat(outPath),
    ]);
    if (
      webpStat.mtime && pngStat.mtime &&
      webpStat.mtime >= pngStat.mtime &&
      webpStat.size > 0
    ) {
      return { input: pngPath, output: outPath, bytes: webpStat.size };
    }
  } catch {
    // webp missing → build
  }

  const pngBytes = await Deno.readFile(pngPath);
  // jsquash types declare `ArrayBuffer | Buffer | Uint8Array` but the esm.sh
  // .d.ts ends up as plain `ArrayBuffer`; Deno.readFile returns a strict
  // Uint8Array, so widen via `as`.
  // deno-lint-ignore no-explicit-any
  const imageData = await decodePng(pngBytes as any);
  const webpBytes = await encodeCapped(imageData);
  await Deno.writeFile(outPath, webpBytes);
  return { input: pngPath, output: outPath, bytes: webpBytes.byteLength };
}

/** Scales an image down to `MAX_WIDTH` (never up) and encodes it as WebP. */
async function encodeCapped(imageData: ImageData): Promise<Uint8Array> {
  const scaled = imageData.width > MAX_WIDTH
    ? await resize(imageData, {
      width: MAX_WIDTH,
      height: Math.round(imageData.height * MAX_WIDTH / imageData.width),
    })
    : imageData;
  // deno-lint-ignore no-explicit-any
  const encoded = await encodeWebp(scaled, { quality: WEBP_QUALITY } as any);
  return asUint8Array(encoded);
}

/** Resizes a WebP that has no PNG source in place when it is wider than `MAX_WIDTH`. */
async function shrinkWebp(webpPath: string): Promise<ProcessedFile | null> {
  const pngPath = webpPath.replace(/\.webp$/, ".png");
  try {
    await Deno.stat(pngPath);
    return null; // built from its PNG above
  } catch {
    // no PNG source
  }
  // deno-lint-ignore no-explicit-any
  const imageData = await decodeWebp(await Deno.readFile(webpPath) as any);
  if (imageData.width <= MAX_WIDTH) return null;
  const webpBytes = await encodeCapped(imageData);
  await Deno.writeFile(webpPath, webpBytes);
  return { input: webpPath, output: webpPath, bytes: webpBytes.byteLength };
}

const pngs: string[] = [];
for await (
  const entry of walk(SCREENSHOTS_DIR, {
    includeDirs: false,
    exts: [".png"],
    // Project logos live as `logo.svg` already; any `logo.png` is a leftover
    // and shouldn't get a webp variant.
    skip: [/\/logo\.png$/],
  })
) {
  pngs.push(entry.path);
}

console.log(`Found ${pngs.length} PNG files in ${SCREENSHOTS_DIR}`);
let totalSrc = 0;
let totalOut = 0;

for (const png of pngs) {
  try {
    const srcStat = await Deno.stat(png);
    totalSrc += srcStat.size;
    const result = await processPng(png);
    if (!result) continue;
    totalOut += result.bytes;
    const rel = png.replace(PROJECT_ROOT, "");
    console.log(`  ${rel} → ${fmtBytes(result.bytes)}`);
  } catch (e) {
    console.error(`  FAIL ${png}: ${(e as Error).message}`);
  }
}

const webps: string[] = [];
for await (
  const entry of walk(SCREENSHOTS_DIR, { includeDirs: false, exts: [".webp"] })
) {
  webps.push(entry.path);
}
for (const webp of webps) {
  try {
    const result = await shrinkWebp(webp);
    if (result) {
      console.log(
        `  ${webp.replace(PROJECT_ROOT, "")} resized → ${
          fmtBytes(result.bytes)
        }`,
      );
    }
  } catch (e) {
    console.error(`  FAIL ${webp}: ${(e as Error).message}`);
  }
}

const saved = Math.max(totalSrc - totalOut, 0);
console.log(
  `\nTotal: ${fmtBytes(totalSrc)} (PNG) → ${fmtBytes(totalOut)} (WebP). ` +
    `Saved ${fmtBytes(saved)} (${
      totalSrc > 0 ? Math.round((saved / totalSrc) * 100) : 0
    }%).`,
);
