#!/usr/bin/env -S deno run -A
/**
 * Generates the 1200×630 link-preview PNGs this site commits under
 * `static/img/og/`: one per blog post, one per project page, one per tool
 * page plus the `/tools` hub (#189), one for `/work` (#270), one for
 * `/about` (#294), one for `/infrastructure` (#295), one for `/how-i-work` (#275), and one
 * landscape default for the site (#193).
 *
 * Run with:
 *   deno task og
 *
 * Dev-machine only. The production Docker build (`denoland/deno:2.9.0`, no
 * Chromium) never runs this script — it only serves the PNGs this script
 * already committed. Renders through the Chromium already pinned for the
 * browser-driven tests (`test/browser.ts`'s `launchChromium()`, version
 * pinned in `deno.json`) instead of adding a new image-rendering dependency
 * (AGENTS.md "own the small, keep the huge" — reuse before adding).
 *
 * Source data only, never the committed cover SVGs: each PNG is built from
 * the post/project title and a one-line description already in
 * `lib/data.ts` or the post's front matter, so regenerating after a title
 * edit (see AGENTS.md's note in this file's own docs section) is this one
 * command.
 */
import { launchChromium } from "../test/browser.ts";
import { blogArticles, projects } from "../lib/data.ts";
import { ROLE } from "../lib/head.ts";
import { tools } from "../lib/tools.ts";
import { metaDescription } from "../lib/llms.ts";
import { workDescription } from "../lib/work.ts";
import { ABOUT_NAME, aboutDescription } from "../lib/about.ts";
import { HOW_I_WORK_NAME, howIWorkDescription } from "../lib/how-i-work.ts";
import { LOCATION } from "../lib/config.ts";
import type { Browser } from "playwright";
import { fromFileUrl } from "@std/path";
import { stripFile } from "./strip-metadata.ts";
import { startSite } from "../test/harness.ts";

const WIDTH = 1200;
const HEIGHT = 630;

// Colors match the coming visual system (#214): Ink background, Parchment
// title text, a muted secondary, the orange accent used only as a small bar.
const BG = "#15120f";
const TITLE_COLOR = "#efebe2";
const SUB_COLOR = "#bcb7af";
const ACCENT = "#f97316";

const ROOT = new URL("../", import.meta.url);
const OG_DIR = new URL("static/img/og/", ROOT);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** First sentence of a (possibly multi-paragraph) description, capped so it fits the card. */
function oneLine(text: string, maxChars = 160): string {
  const firstParagraph = text.split(/\n\n+/)[0].replace(/\s+/g, " ").trim();
  const firstSentence = firstParagraph.match(/^[^.!?]*[.!?]/)?.[0] ??
    firstParagraph;
  const source = firstSentence.length <= maxChars
    ? firstSentence
    : firstParagraph;
  return source.length > maxChars
    ? `${source.slice(0, maxChars - 1).trimEnd()}…`
    : source;
}

function cardHtml(title: string, subtitle: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${WIDTH}px; height: ${HEIGHT}px; background: ${BG}; overflow: hidden;
  }
  body {
    display: flex; flex-direction: column; justify-content: center;
    padding: 84px;
    font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  .bar { width: 64px; height: 6px; background: ${ACCENT}; margin-bottom: 36px; }
  h1 {
    color: ${TITLE_COLOR}; font-size: 58px; line-height: 1.22; font-weight: 700;
    max-width: 1020px;
  }
  p {
    color: ${SUB_COLOR}; font-size: 28px; line-height: 1.4; margin-top: 28px;
    max-width: 920px;
  }
</style></head>
<body>
  <div class="bar"></div>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
</body></html>`;
}

async function render(
  browser: Browser,
  html: string,
  outUrl: URL,
): Promise<number> {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  try {
    await page.setContent(html, { waitUntil: "load" });
    await Deno.mkdir(new URL("./", outUrl), { recursive: true });
    // Playwright's `path` option is an OS path, not a URL — `.pathname`
    // isn't one (unescaped, and wrong on Windows), so go through
    // `@std/path`'s `fromFileUrl`.
    await page.screenshot({ path: fromFileUrl(outUrl), type: "png" });
    const info = await Deno.stat(outUrl);
    return info.size;
  } finally {
    await page.close();
  }
}

const SOCIAL_WIDTH = 1280;
const SOCIAL_HEIGHT = 640;
const SOCIAL_FILE = new URL("docs/social-preview.png", ROOT);
const FONT_DIR = new URL("assets/fonts/", ROOT);

async function fontFace(
  family: string,
  file: string,
  weight: number,
  style = "normal",
): Promise<string> {
  const data = await Deno.readFile(new URL(file, FONT_DIR));
  return `@font-face { font-family: "${family}"; font-weight: ${weight}; font-style: ${style};
    src: url(data:font/woff2;base64,${data.toBase64()}) format("woff2"); }`;
}

/**
 * Card for the repository's GitHub social preview (#291): the site's name and
 * role on the left, a dark screenshot of the built home page bleeding off the
 * right edge. Colours and fonts are the `@theme` ones in `assets/styles.css`.
 */
function socialHtml(shotBase64: string, fonts: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  ${fonts}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${SOCIAL_WIDTH}px; height: ${SOCIAL_HEIGHT}px; background: ${BG}; overflow: hidden;
  }
  body { position: relative; font-family: "IBM Plex Sans", sans-serif; }
  .text { position: absolute; left: 72px; top: 0; bottom: 0; width: 470px;
    display: flex; flex-direction: column; justify-content: center; }
  .bar { width: 64px; height: 6px; background: ${ACCENT}; margin-bottom: 36px; }
  h1 { font-family: "Literata", serif; font-weight: 600; color: ${TITLE_COLOR};
    font-size: 64px; line-height: 1.1; }
  p { color: ${SUB_COLOR}; font-size: 30px; line-height: 1.35; margin-top: 28px;
    text-wrap: balance; }
  .shot { position: absolute; left: 600px; top: 96px; width: 800px; height: 500px;
    border: 1px solid #413c38; border-radius: 14px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); }
  .shot img { display: block; width: 800px; height: 500px; }
</style></head>
<body>
  <div class="text">
    <div class="bar"></div>
    <h1>Anton Shubin</h1>
    <p>${escapeHtml(ROLE)}</p>
  </div>
  <div class="shot"><img src="data:image/png;base64,${shotBase64}" alt=""></div>
</body></html>`;
}

/** Writes `docs/social-preview.png`: needs a built site (`deno task build`). */
async function socialPreview(browser: Browser): Promise<number> {
  // Placeholder booking URL only so the Book button shows as on production;
  // the home page loads no calendar and nothing leaves the machine.
  const site = await startSite({
    env: {
      SCHEDULE_URL: "https://meet.example.com/",
      UMAMI_URL: "",
      UMAMI_ID: "",
    },
  });
  let shot: Uint8Array;
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: "dark",
    });
    try {
      await page.goto(`${site.origin}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      shot = await page.screenshot({ type: "png", animations: "disabled" });
    } finally {
      await page.close();
    }
  } finally {
    await site.stop();
  }
  const fonts = (await Promise.all([
    fontFace("Literata", "literata-latin-600-normal.woff2", 600),
    fontFace("IBM Plex Sans", "ibm-plex-sans-latin-400-normal.woff2", 400),
  ])).join("\n");
  const page = await browser.newPage({
    viewport: { width: SOCIAL_WIDTH, height: SOCIAL_HEIGHT },
  });
  try {
    await page.setContent(socialHtml(shot.toBase64(), fonts), {
      waitUntil: "load",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fromFileUrl(SOCIAL_FILE), type: "png" });
  } finally {
    await page.close();
  }
  const bytes = await stripFile(fromFileUrl(SOCIAL_FILE));
  console.log(`docs/social-preview.png  (metadata stripped: ${bytes} B)`);
  return (await Deno.stat(SOCIAL_FILE)).size;
}

function fmtBytes(n: number): string {
  return n < 1024 ? `${n}B` : `${(n / 1024).toFixed(1)}KB`;
}

async function main() {
  const browser = await launchChromium();
  let count = 0;
  try {
    for (const article of blogArticles) {
      const html = cardHtml(article.title, oneLine(article.description));
      const outUrl = new URL(`blog/${article.slug}.png`, OG_DIR);
      const bytes = await render(browser, html, outUrl);
      console.log(`blog/${article.slug}.png  ${fmtBytes(bytes)}`);
      count++;
    }

    const allProjects = projects.freelance.filter((
      p,
    ): p is typeof p & { slug: string } => Boolean(p.slug));
    for (const project of allProjects) {
      const html = cardHtml(project.title, oneLine(project.description));
      const outUrl = new URL(`projects/${project.slug}.png`, OG_DIR);
      const bytes = await render(browser, html, outUrl);
      console.log(`projects/${project.slug}.png  ${fmtBytes(bytes)}`);
      count++;
    }

    for (const t of tools) {
      const html = cardHtml(`${t.name}: ${t.job}`, oneLine(t.summary));
      const outUrl = new URL(`tools/${t.slug}.png`, OG_DIR);
      const bytes = await render(browser, html, outUrl);
      console.log(`tools/${t.slug}.png  ${fmtBytes(bytes)}`);
      count++;
    }

    const toolsHubBytes = await render(
      browser,
      cardHtml(
        "Tools I build and run myself",
        "Open-source tools, each with its status, CI status and install.",
      ),
      new URL("tools.png", OG_DIR),
    );
    console.log(`tools.png  ${fmtBytes(toolsHubBytes)}`);
    count++;

    // /work (#270): the page's own title and meta description.
    const workBytes = await render(
      browser,
      cardHtml(
        "Client work and case studies",
        metaDescription(workDescription(ROLE)),
      ),
      new URL("work.png", OG_DIR),
    );
    console.log(`work.png  ${fmtBytes(workBytes)}`);
    count++;

    // /about (#294): the page's name and meta description.
    const aboutBytes = await render(
      browser,
      cardHtml(ABOUT_NAME, aboutDescription(LOCATION)),
      new URL("about.png", OG_DIR),
    );
    console.log(`about.png  ${fmtBytes(aboutBytes)}`);
    count++;

    // /how-i-work (#275): the page's name and its description.
    const howIWorkBytes = await render(
      browser,
      cardHtml(HOW_I_WORK_NAME, metaDescription(howIWorkDescription())),
      new URL("how-i-work.png", OG_DIR),
    );
    console.log(`how-i-work.png  ${fmtBytes(howIWorkBytes)}`);
    count++;

    // /infrastructure (#295): the page's own title and description.
    const infraBytes = await render(
      browser,
      cardHtml(
        "How I run production",
        "Docker Compose behind Traefik, Authelia sign-in, restic backups, Gatus checks and self-hosted CI, with the live services linked.",
      ),
      new URL("infrastructure.png", OG_DIR),
    );
    console.log(`infrastructure.png  ${fmtBytes(infraBytes)}`);
    count++;

    const defaultHtml = cardHtml("Anton Shubin", ROLE);
    const defaultBytes = await render(
      browser,
      defaultHtml,
      new URL("default.png", OG_DIR),
    );
    console.log(`default.png  ${fmtBytes(defaultBytes)}`);
    count++;

    // The repository's GitHub social preview (#291), 1280×640.
    console.log(
      `social-preview.png  ${fmtBytes(await socialPreview(browser))}`,
    );
  } finally {
    await browser.close();
  }
  console.log(`\nGenerated ${count} OG images under static/img/og/.`);
}

if (import.meta.main) {
  await main();
}
