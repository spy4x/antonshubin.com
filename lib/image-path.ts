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
