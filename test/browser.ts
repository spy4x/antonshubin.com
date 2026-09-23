// Shared setup for the browser-driven tests (test/lead-form.browser.test.ts,
// test/a11y.browser.test.ts) — both launch Chromium through the same pinned
// Playwright version. An upgrade changes that version here, in deno.json's
// import map and in .woodpecker.yml's install command (AGENTS.md cites it too).
// See AGENTS.md "Browser-driven tests" for why these tests need Chromium and
// their own `-A` task instead of the plain `deno task test` glob.
import { chromium } from "playwright";
import type { Browser } from "playwright";

/**
 * Must match the `"playwright"` entry in deno.json's import map and the
 * install command in .woodpecker.yml — a version mismatch downloads a
 * different Chromium build than the one these tests launch.
 */
export const PLAYWRIGHT_VERSION = "1.63.0";

/**
 * Launches Chromium, or throws an error naming the exact install command,
 * so a missing browser fails the build instead of silently skipping the
 * test that called this.
 */
export async function launchChromium(): Promise<Browser> {
  try {
    // CI (Woodpecker/denoland/deno:2.9.0) runs this container as root, and
    // Chromium's own sandbox refuses to start as root without this flag.
    // Harmless here: the browser only ever loads the site the calling test
    // just booted, never third-party content.
    return await chromium.launch({ args: ["--no-sandbox"] });
  } catch (cause) {
    const installCmd =
      `deno run -A npm:playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium`;
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `chromium.launch() failed — no compatible Chromium build found. ` +
        `Install one with \`${installCmd}\` ` +
        `(see AGENTS.md "Rendered-page tests" for why this test needs its ` +
        `own task). Original error: ${reason}`,
      { cause },
    );
  }
}
