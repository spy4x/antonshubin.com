/**
 * Draws the still layers the Seed demo clip composes over its videos, as
 * 1440x900 PNGs with a transparent background, in the site's colours and
 * IBM Plex Sans:
 *
 * - `frame-<host>.png`: a browser window around a transparent 1376x796 hole
 *   at (32, 72), with the host in its address bar, matching the terminal
 *   window VHS draws (`terminal-*.tape`).
 * - `caption-<n>.png`: a small label in the bottom-right corner, such as
 *   "Sped up 12×", for a part of the clip that hides time.
 *
 * Usage: deno run -A scripts/clips/seed/overlays.ts <out-dir> <host>... -- <caption>...
 */
import { chromium } from "playwright"

const FONTS = new URL("../../../assets/fonts/", import.meta.url).href
const W = 1440
const H = 900

const base = `
@font-face { font-family: Plex; font-weight: 400; src: url(${FONTS}ibm-plex-sans-latin-400-normal.woff2) }
@font-face { font-family: Plex; font-weight: 600; src: url(${FONTS}ibm-plex-sans-latin-600-normal.woff2) }
html, body { margin: 0; width: ${W}px; height: ${H}px; background: transparent; overflow: hidden }
body { font-family: Plex, sans-serif; position: relative }
`

/** The window: 32 px margin, a 40 px bar, a transparent page area under it. */
function frameHtml(host: string): string {
  return `<!doctype html><meta charset="utf-8"><style>${base}
.win { position: absolute; left: 32px; top: 32px; width: 1376px; height: 836px;
  border-radius: 10px; box-shadow: 0 0 0 400px #15120f; overflow: hidden }
.bar { height: 40px; background: #1c1916; display: flex; align-items: center; gap: 6px;
  padding: 0 14px; border-bottom: 1px solid #2f2a26; box-sizing: border-box }
.dot { width: 12px; height: 12px; border-radius: 50% }
.url { position: absolute; left: 50%; transform: translateX(-50%); top: 7px; height: 26px;
  min-width: 360px; box-sizing: border-box; padding: 0 14px; border-radius: 6px;
  background: #15120f; color: #bcb7af; font-size: 14px; line-height: 26px; text-align: center }
.url b { color: #efebe2; font-weight: 400 }
</style><div class="win"><div class="bar">
<span class="dot" style="background:#ff5f58"></span>
<span class="dot" style="background:#ffbd2e"></span>
<span class="dot" style="background:#18c132"></span>
<span class="url">http://<b>${host}</b></span></div></div>`
}

function captionHtml(text: string): string {
  return `<!doctype html><meta charset="utf-8"><style>${base}
.cap { position: absolute; right: 56px; bottom: 52px; padding: 6px 14px; border-radius: 999px;
  background: #2f2a26; border: 1px solid #857f79; color: #efebe2; font-size: 18px;
  font-weight: 600; letter-spacing: .01em }
</style><span class="cap">${text}</span>`
}

async function main() {
  const split = Deno.args.indexOf("--")
  const [out, ...hosts] = split === -1 ? Deno.args : Deno.args.slice(0, split)
  const captions = split === -1 ? [] : Deno.args.slice(split + 1)
  if (!out) {
    throw new Error("usage: overlays.ts <out-dir> <host>... -- <caption>...")
  }
  const dir = await Deno.makeTempDir()
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } })
    const shoot = async (html: string, file: string) => {
      const path = `${dir}/layer.html`
      await Deno.writeTextFile(path, html)
      await page.goto(`file://${path}`)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: file, omitBackground: true })
    }
    for (const host of hosts) {
      await shoot(frameHtml(host), `${out}/frame-${host}.png`)
    }
    for (const [i, text] of captions.entries()) {
      await shoot(captionHtml(text), `${out}/caption-${i}.png`)
    }
  } finally {
    await browser.close()
    await Deno.remove(dir, { recursive: true })
  }
}

if (import.meta.main) await main()
