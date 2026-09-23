// Colour-contrast regression guard for issue #160. axe-core's color-contrast
// rule needs real layout and computed styles, which a plain HTML fetch
// (test/rendered.test.ts) never sees, so this runs through Chromium the same
// way test/a11y.browser.test.ts does.
//
// It checks five representative pages rather than the full sitemap (see the
// PR body for the full 48-page crawl): the home page, the catalog index (with
// its two nested <details> opened, since axe skips content a <details> hides
// by default), a blog post with inline code, a blog post without it, and the
// contact page — plus one synthetic probe (see below). A full-site crawl
// belongs in a one-off audit script, not a task that runs on every push —
// this only needs to catch a *regression* in the fixed tokens
// (assets/styles.css `@theme`) or the class edits that went with them
// (islands/Menu.tsx, routes/contact-me.tsx, the four text-gray-600-to-400
// spots, assets/styles.css's .img-title and inline <code> rules), not repeat
// the full audit.
//
// Coverage against the ten fixes in this PR, each confirmed to turn this
// test red by reverting it locally and rerunning:
//   1. --color-gray-500 (secondary text)          — every page below
//   2. --color-gray-400 (tag pills, captions)      — the synthetic probe
//      below, not any of the five real pages (see why there)
//   3. --color-orange-600 (button/badge surfaces) — the active nav pill,
//      present in <nav> on every page below
//   4. bg-orange-500 -> bg-orange-600 on the active nav pill (islands/Menu.tsx)
//      — same as above
//   5. bg-orange-500 -> bg-orange-600 on inline <code> (assets/styles.css)
//      — /blog/building-mcp-servers-with-deno, which has inline `code` spans
//      in its body text (not just fenced ```code blocks, which use <pre> and
//      a different, already-passing rule)
//   6. components/Breadcrumb.tsx's "/" separator (text-gray-600 -> gray-400)
//      — /contact-me, via a manual ratio check, not axe (see below)
//   7. routes/catalog/index.tsx's "Not included" "x" marker
//      (text-gray-600 -> gray-400) — /catalog, after opening its two nested
//      <details>, via the same manual ratio check
//   8. bg-sky-600 -> bg-sky-700 on the Telegram button (routes/contact-me.tsx)
//      — /contact-me
//   9 & 10. routes/blog/[slug].tsx's two captions (text-gray-600 -> gray-400)
//      — both render on every blog post below
//
// #2 needs its own probe: --color-gray-400 was already comfortably above AA
// (5.78:1) against gray-800, the background most of its real uses sit on —
// its one failing pairing pre-fix (4.06:1) is specifically text-gray-400 on
// bg-gray-700, used by islands/GhStars.tsx's "no stars yet / fetch failed"
// fallback badge (and, as plain placeholder text rather than a contrast
// requirement, islands/LeadForm.tsx's placeholder-gray-400 inputs, which
// also sit on bg-gray-700). Every other text-gray-400 use on these five
// pages already sits on a background dark enough that even the pre-fix
// value passed, so visiting real pages alone never exercises the pairing
// that actually failed (confirmed: reverting the token alone left this test
// green until the probe below was added). GhStars also fetches live star
// counts from api.github.com client-side, so loading a page that renders it
// for real would make this test's result depend on network conditions and
// GitHub's API — not something to add to a deterministic suite. Instead,
// the probe injects that one class combination directly onto an
// already-loaded page (reusing its already-loaded stylesheet) and asks axe
// to check only that element, which is deterministic and network-free.
//
// #6 and #7 need a manual ratio check instead of axe, for two different
// reasons neither related to the actual colour: the breadcrumb "/" carries
// `aria-hidden="true"` (it is decorative — the separation is already given
// by the list markup), and axe's color-contrast rule skips any node
// excluded from the accessibility tree, aria-hidden included, regardless of
// whether it is visually rendered. The catalog "x" is skipped for an
// unrelated reason: axe classifies a lone symbol character ("x", "✓", …) as
// "non-text content" and reports it under `incomplete`, never `violations`
// — confirmed by reverting each one locally: both stayed green under axe
// alone, so `getContrastRatio` below computes the same WCAG relative-
// luminance ratio axe itself uses, directly from `getComputedStyle`, and
// both are confirmed to turn red on a revert (see git history for this
// file's development, or rerun the revert locally).
//
// Not covered here, and not cheap to add without a page this PR's fix does
// not otherwise need: assets/styles.css's .img-title rule (text-slate-500 ->
// gray-400). It only renders from raw HTML inside one blog post's markdown
// (content/blog/from-office-job-to-freelance-to-my-startups.md), which none
// of the five pages below load for any other reason. Also not covered:
// routes/catalog/[slug].tsx's own "x" marker (a different element from #7
// above, gray-600 -> gray-400 as well) — no catalog/[slug] page is in this
// set, since /catalog's nested <details> already exercises the same class
// edit's token. If either of these two regresses on its own, only the
// full-sitemap audit script (see the PR body) would catch it, not this test.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import axeCore from "axe-core";
import type { Browser, Page } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";

interface AxeNode {
  target: string[];
  html: string;
  failureSummary: string;
}
interface AxeViolation {
  id: string;
  nodes: AxeNode[];
}
interface AxeRunResult {
  violations: AxeViolation[];
}

/** Runs axe-core's WCAG 2 A/AA rules against `context` (a selector, element,
 * or Document) already loaded in `page`, and returns the color-contrast
 * violation nodes found, if any. Injects axe-core's own bundled source via
 * `addScriptTag` rather than fetching it, so the test makes no network call
 * of its own; `context` is passed as a string selector across the
 * `page.evaluate` boundary, since a live element handle can't cross it. */
async function colorContrastViolations(
  page: Page,
  context: string,
): Promise<AxeNode[]> {
  await page.addScriptTag({ content: axeCore.source });
  const results = await page.evaluate(async (sel) => {
    // deno-lint-ignore no-explicit-any
    const axe = (globalThis as any).axe;
    return await axe.run(document.querySelector(sel) ?? document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  }, context) as AxeRunResult;
  return results.violations.find((v) => v.id === "color-contrast")?.nodes ?? [];
}

/** Navigates `page` to `path` and asserts zero axe color-contrast
 * violations there. */
async function assertNoContrastViolations(
  page: Page,
  origin: string,
  path: string,
): Promise<void> {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  const nodes = await colorContrastViolations(page, "html");
  assertEquals(
    nodes.map((n) => n.html),
    [],
    `${path} must have zero axe color-contrast violations`,
  );
}

/** Computes the WCAG 2 contrast ratio between the first element matching
 * `selector` (optionally narrowed to one whose own text content, trimmed,
 * equals `exactText`) and its effective background (the nearest
 * non-transparent `background-color` among itself and its ancestors), using
 * the same relative-luminance formula axe-core's own color-contrast rule
 * uses. For the handful of elements axe itself won't judge — aria-hidden
 * nodes (excluded from the accessibility tree entirely) and lone symbol
 * characters ("x", "✓", classified as "non-text content") — see the file
 * header for which two and why. Returns `null` if `selector`/`exactText`
 * matches nothing; throws if a matched element's colour can't be parsed.
 *
 * Colours are parsed through a 1x1 `<canvas>` rather than a `rgb(...)`
 * regex: Tailwind v4's palette is defined in `oklch()`, and
 * `getComputedStyle` returns whatever colour space the declaration used
 * (`oklch(...)`, not `rgb(...)`) rather than normalizing it, so a regex
 * built for `rgb()`/`rgba()` alone would silently fail to match — and
 * previously did, defaulting to black rather than raising. Canvas's
 * `fillStyle` accepts any CSS `<color>` the browser understands (oklch
 * included, since it's the same engine that painted the page) and, per
 * spec, *ignores* an unparseable assignment rather than throwing —
 * leaving the previous value in place. Setting a sentinel value first and
 * checking whether it survived the real assignment is how that spec
 * behaviour is turned back into a thrown error here. */
function getContrastRatio(
  page: Page,
  selector: string,
  exactText?: string,
): Promise<number | null> {
  return page.evaluate(({ sel, text }) => {
    const candidates = [...document.querySelectorAll(sel)];
    const el = text === undefined
      ? candidates[0]
      : candidates.find((c) => c.textContent?.trim() === text);
    if (!el) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const UNPARSEABLE_SENTINEL = "#010203";

    /** Parses any CSS colour Chromium can paint (oklch, rgb, hex, named,
     * ...) into 0-255 RGBA channels, via the canvas 2D context's own colour
     * parser. Throws if `color` isn't a valid CSS `<color>`. */
    function parseColor(color: string): [number, number, number, number] {
      ctx.fillStyle = UNPARSEABLE_SENTINEL;
      ctx.fillStyle = color;
      if (ctx.fillStyle === UNPARSEABLE_SENTINEL) {
        throw new Error(`getContrastRatio: could not parse colour "${color}"`);
      }
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a];
    }
    function relativeLuminance(r: number, g: number, b: number): number {
      const chan = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
    }

    const [tr, tg, tb] = parseColor(getComputedStyle(el).color);

    let bg: [number, number, number, number] = [0, 0, 0, 0];
    let node: Element | null = el;
    while (node) {
      const parsed = parseColor(getComputedStyle(node).backgroundColor);
      if (parsed[3] > 0) {
        bg = parsed;
        break;
      }
      node = node.parentElement;
    }
    const l1 = relativeLuminance(tr, tg, tb);
    const l2 = relativeLuminance(bg[0], bg[1], bg[2]);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }, { sel: selector, text: exactText });
}

Deno.test("getContrastRatio matches axe's own reported ratio for a known oklch pairing", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      // white text on bg-sky-600 (Tailwind v4's oklch(58.8% .158 241.966),
      // #0084d1 once painted) is a known quantity: axe itself reports this
      // exact pairing's ratio as 4.02 on routes/contact-me.tsx's Telegram
      // button pre-fix (see the PR body's evidence). Reproducing that number
      // here, from a synthetic element rather than a real page, is this
      // helper's own proof that routing colours through a <canvas> — needed
      // for oklch, see getContrastRatio's docs above — gives the same answer
      // as the browser's actual rendering, not just a plausible one.
      await page.goto(site.origin, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const el = document.createElement("span");
        el.id = "contrast-probe-white-on-sky-600";
        el.className = "bg-sky-600 text-white";
        el.textContent = "probe";
        document.body.appendChild(el);
      });
      const ratio = await getContrastRatio(
        page,
        "#contrast-probe-white-on-sky-600",
      );
      assert(ratio !== null, "probe element must be found");
      assert(
        Math.abs(ratio - 4.02) < 0.01,
        `white on bg-sky-600 must be ~4.02, got ${ratio}`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("no WCAG AA colour-contrast violations across five representative pages", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      for (
        const path of [
          "/",
          "/contact-me",
          "/blog/ship-it-today",
          "/blog/building-mcp-servers-with-deno",
        ]
      ) {
        await assertNoContrastViolations(page, site.origin, path);
      }

      // components/Breadcrumb.tsx's "/" separator: aria-hidden, so axe never
      // judges it (see the file header) — checked manually instead. Still on
      // the last page from the loop above (/blog/building-mcp-servers-with-deno,
      // whose breadcrumb is Home > Blog > post title — any page in the loop
      // with more than one crumb would do).
      const breadcrumbSepRatio = await getContrastRatio(
        page,
        'nav[aria-label="Breadcrumb"] span[aria-hidden="true"]',
      );
      assert(
        breadcrumbSepRatio !== null && breadcrumbSepRatio >= 4.5,
        `breadcrumb separator contrast ratio must be >= 4.5, got ${breadcrumbSepRatio}`,
      );

      // /catalog's "Not included" list sits inside two nested <details>,
      // closed by default — axe only checks visible content, so opening both
      // is required to exercise routes/catalog/index.tsx's "x" marker fix
      // (see the file header). Playwright's click on <summary> toggles the
      // native <details>, same as a real visitor would.
      await page.goto(`${site.origin}/catalog`, { waitUntil: "networkidle" });
      for (
        const label of ["What's included", "Not included"]
      ) {
        const summaries = page.getByText(label, { exact: true });
        const count = await summaries.count();
        for (let i = 0; i < count; i++) {
          await summaries.nth(i).click();
        }
      }
      const catalogNodes = await colorContrastViolations(page, "html");
      assertEquals(
        catalogNodes.map((n) => n.html),
        [],
        "/catalog, with its 'Not included' details open, must have zero axe color-contrast violations",
      );

      // The "x" marker itself: axe classifies it as "non-text content" and
      // never puts it in `violations` regardless of colour (see the file
      // header) — checked manually instead.
      const catalogXRatio = await getContrastRatio(
        page,
        "details[open] span",
        "×",
      );
      assert(
        catalogXRatio !== null && catalogXRatio >= 4.5,
        `catalog "not included" x marker contrast ratio must be >= 4.5, got ${catalogXRatio}`,
      );

      // Synthetic probe for --color-gray-400: see the file header for why
      // no real page exercises its one failing pairing (text-gray-400 on
      // bg-gray-700, islands/GhStars.tsx's fallback badge) deterministically.
      // Reuses the already-loaded /catalog page's stylesheet.
      await page.evaluate(() => {
        const el = document.createElement("span");
        el.id = "contrast-probe-gray-400-on-gray-700";
        el.className = "bg-gray-700 text-gray-400";
        el.textContent = "GitHub";
        document.body.appendChild(el);
      });
      try {
        const probeNodes = await colorContrastViolations(
          page,
          "#contrast-probe-gray-400-on-gray-700",
        );
        assertEquals(
          probeNodes.map((n) => n.html),
          [],
          "text-gray-400 on bg-gray-700 (islands/GhStars.tsx's fallback badge) must pass AA",
        );
      } finally {
        await page.evaluate(() => {
          document.getElementById("contrast-probe-gray-400-on-gray-700")
            ?.remove();
        });
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
