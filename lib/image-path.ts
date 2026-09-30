/**
 * Pure image-path helpers. Kept side-effect-free so they can be unit-tested
 * without pulling in Preact / DOM.
 */

/**
 * Given `…/foo/01-home.png`, return webp candidate path `…/foo/01-home.webp`.
 * Returns null if path does not end in `.png` (case-insensitive).
 */
export function webpForPng(src: string): string | null {
  if (!src.toLowerCase().endsWith(".png")) return null;
  return src.slice(0, -4) + ".webp";
}

/**
 * The widest a project screenshot may be. Wider ones make the lightbox lag,
 * because the browser decodes every pixel before it paints (#336).
 * `deno task optimize:screenshots` scales down to it.
 */
export const MAX_SCREENSHOT_WIDTH = 1600;
