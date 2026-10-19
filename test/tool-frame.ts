// Shared checks for every /tools/<slug> page (#454): the parts of the tool
// frame each page keeps, in the built HTML and in a browser. A custom page's
// own test (`test/tools-<slug>.test.ts`) calls these, so it checks only its
// middle; `test/tool-frame.test.ts` and `test/tool-frame.browser.test.ts`
// run them over every tool page.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import axeCore from "axe-core";
import type { Page } from "playwright";
import { count, pageBody, visibleText } from "./html.ts";
import { heroStill } from "../components/tool-frame/tool-page.ts";
import type { Tool } from "../lib/tools.ts";

/** What a page changed in the frame, so the checks expect it. */
export interface ToolFrameOptions {
  /** False when the page passes `showJob={false}` to the hero. */
  showJob?: boolean;
}

/** Every `<img ... loading="eager">` (or with no `loading`) in `html`. */
function eagerImages(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag).filter((
    tag,
  ) => !/loading="lazy"/.test(tag));
}

/**
 * Checks the built HTML of `tool`'s page against the frame: one `<h1>`
 * reading the `headline` (else "name: job"), the top line's name, job and
 * status mark, at most one eager image and it is the hero still with
 * `fetchpriority="high"`, the facts card with "View on GitHub" as its only
 * link to the repository, the "Two ways to use it" band with the page body's
 * one Book, and More tools after it ending with "All tools".
 * `html` is the whole page; the checks look at the page body only.
 */
export function assertToolFrame(
  tool: Tool,
  html: string,
  { showJob = true }: ToolFrameOptions = {},
): void {
  const where = `/tools/${tool.slug}`;
  const page = pageBody(html);

  const h1s = [...page.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)];
  assertEquals(h1s.length, 1, `${where}: <h1> count`);
  assertEquals(
    visibleText(h1s[0][0]),
    tool.headline ?? `${tool.name}: ${tool.job}`,
    `${where}: <h1>`,
  );

  const topStart = page.indexOf("data-tool-eyebrow");
  assert(topStart !== -1, `${where}: no top line`);
  const top = page.slice(topStart, page.indexOf("</p>", topStart));
  const topText = visibleText(`<x ${top}`);
  assert(topText.startsWith(tool.name), `${where}: top line "${topText}"`);
  assertEquals(top.includes("data-tool-job"), showJob, `${where}: job`);
  if (showJob) assert(topText.includes(tool.job), `${where}: job text`);
  assert(
    top.includes(`data-tool-status="${tool.status}"`) && /<svg/.test(top),
    `${where}: status mark`,
  );

  const eager = eagerImages(page);
  const still = heroStill(tool);
  assertEquals(eager.length, still ? 1 : 0, `${where}: eager images`);
  if (still) {
    assert(eager[0].includes('fetchpriority="high"'), `${where}: priority`);
    assert(eager[0].includes(`src="${still.src}`), `${where}: ${eager[0]}`);
    const media = page.indexOf("data-tool-media");
    assert(
      media !== -1 && page.indexOf(eager[0]) > media,
      `${where}: the eager image is not the hero media`,
    );
  }
  assertEquals(
    count(page, /fetchpriority="high"/g),
    still ? 1 : 0,
    `${where}: high-priority images`,
  );

  const facts = page.indexOf('aria-label="Tool facts"');
  assert(facts !== -1, `${where}: no facts card`);
  const bandAt = page.indexOf("data-closing-band");
  const moreAt = page.indexOf("data-tool-more");
  assert(facts < bandAt && bandAt < moreAt, `${where}: part order`);

  const band = page.slice(bandAt, moreAt);
  assert(
    visibleText(`<x ${band}`).startsWith("Two ways to use it"),
    `${where}: band heading`,
  );
  assertEquals(count(band, /data-tool-door="/g), 2, `${where}: band columns`);
  // Book shows only when a booking URL is set; the browser checks run with one.
  assertEquals(
    count(page, /data-primary-book/g),
    count(band, /data-primary-book/g),
    `${where}: a Book outside the band`,
  );
  assert(
    count(page, /data-primary-book/g) <= 1,
    `${where}: more than one Book`,
  );

  const text = visibleText(page);
  for (const gone of ["Report an issue", "Star on GitHub", "Don't use it if"]) {
    assert(!text.includes(gone), `${where}: "${gone}"`);
  }
  assert(
    page.includes(`/tools" data-umami-event="cta"`) &&
      text.includes("All tools"),
    `${where}: All tools`,
  );
}

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

/** Rule ids and offending markup of every axe-core WCAG 2 A/AA violation on `page`. */
export async function axeViolations(page: Page): Promise<string[]> {
  // Injected through page.evaluate, not a <script> tag, so the site's CSP
  // does not block it (see test/contrast.browser.test.ts).
  await page.evaluate(axeCore.source);
  const results = await page.evaluate(async () => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }) as { violations: { id: string; nodes: { html: string }[] }[] };
  return results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 160)}`)
  );
}

/**
 * Opens `${origin}${path}` at 390 and 1440px in `page` and returns every
 * problem found: an axe-core WCAG 2 A/AA violation, a page wider than its
 * viewport, or a count of `<h1>` other than one. An empty list is a pass.
 */
export async function toolPageProblems(
  page: Page,
  origin: string,
  path: string,
): Promise<string[]> {
  const problems: string[] = [];
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    const at = `${path} at ${viewport.width}px`;
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
    );
    if (overflow > 0) problems.push(`${at}: scrolls sideways by ${overflow}px`);
    const h1 = await page.locator("h1").count();
    if (h1 !== 1) problems.push(`${at}: ${h1} <h1>`);
    for (const v of await axeViolations(page)) problems.push(`${at}: ${v}`);
  }
  return problems;
}
