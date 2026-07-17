#!/usr/bin/env -S deno run -A
/**
 * Optimize project screenshots: PNG to WebP.
 *
 * Run once to regenerate webp variants under static/img/projects/:
 *   deno task optimize:screenshots
 *
 * Idempotent — skips files whose webp output is already newer than the source.
 *
 * @jsquash/png and @jsquash/webp are pure-WASM, no native deps.
 */
import { walk } from "jsr:@std/fs@^1.0.0/walk";
import { decode as decodePng } from "https://esm.sh/@jsquash/png@3.0.1?target=denonext&pin=v135";
import { encode as encodeWebp } from "https://esm.sh/@jsquash/webp@1.5.0?target=denonext&pin=v135";

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
  // deno-lint-ignore no-explicit-any
  const encoded = await encodeWebp(imageData, { quality: WEBP_QUALITY } as any);
  const webpBytes = asUint8Array(encoded);
  await Deno.writeFile(outPath, webpBytes);
  return { input: pngPath, output: outPath, bytes: webpBytes.byteLength };
}

const pngs: string[] = [];
for await (
  const entry of walk(SCREENSHOTS_DIR, {
    includeDirs: false,
    exts: [".png"],
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

const saved = Math.max(totalSrc - totalOut, 0);
console.log(
  `\nTotal: ${fmtBytes(totalSrc)} (PNG) → ${fmtBytes(totalOut)} (WebP). ` +
    `Saved ${fmtBytes(saved)} (${
      totalSrc > 0 ? Math.round((saved / totalSrc) * 100) : 0
    }%).`,
);
