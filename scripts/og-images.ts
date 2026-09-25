#!/usr/bin/env -S deno run -A
/**
 * Generates the 1200×630 link-preview PNGs this site commits under
 * `static/img/og/`: one per blog post, one per project page, one per tool
 * page plus the `/tools` hub (#189), and one landscape default for the site
 * (#193).
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
import type { Browser } from "playwright";
import { fromFileUrl } from "@std/path";

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

    const allProjects = [...projects.my, ...projects.freelance].filter((
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

    const defaultHtml = cardHtml("Anton Shubin", ROLE);
    const defaultBytes = await render(
      browser,
      defaultHtml,
      new URL("default.png", OG_DIR),
    );
    console.log(`default.png  ${fmtBytes(defaultBytes)}`);
    count++;
  } finally {
    await browser.close();
  }
  console.log(`\nGenerated ${count} OG images under static/img/og/.`);
}

if (import.meta.main) {
  await main();
}
