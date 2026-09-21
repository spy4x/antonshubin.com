// Guards for issue #111 (and its review round, #111 follow-up): the inline
// scheduler facade on `/`, `/how-i-work` and `/contact-me`. Three things are
// guarded per page:
//  1. The facade button and the standalone fallback link both exist, and the
//     fallback's `href` really is the scheduler's URL — this must run before
//     the "nothing fetches the origin" check below, otherwise that check
//     passes vacuously when `SCHEDULE_URL` never reached the server (the
//     origin then never appears anywhere, so there is nothing to find).
//  2. Nothing that makes a browser fetch eagerly (`src`, `srcset`,
//     `<link href>`, a protocol-relative reference, or a CSS `url(...)`
//     inside a `style` attribute or a `<style>` block) points at the
//     scheduler's origin before a click. A plain `<a href>` fallback link is
//     expected and allowed, and so is the URL turning up inside Fresh's
//     serialized island-hydration props — confirmed present in the built
//     HTML for `/how-i-work` and `/contact-me`; it never renders as a
//     fetchable attribute.
//  3. On `/`, the collapsed success panel (and, once success shows, the
//     collapsed form panel) carries `inert`, so a Tab press can't reach a
//     control that is invisible at `max-height: 0`.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count } from "./html.ts";

const SCHEDULER_ORIGIN = "https://meet.example.com";
const SCHEDULER_HOST = "meet.example.com";
const FACADE_EVENT = 'data-umami-event="meet-embed-click-to-load"';
const FALLBACK_EVENT = "meet-embed-fallback-click";

/** Escapes regex metacharacters so a literal string can go inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** All `<tagName ...>` opening tags in `html`, in document order. */
function openTags(html: string, tagName: string): string[] {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map(
    (m) => m[0],
  );
}

/** The value of `attr="..."` inside a single tag string, or `null` if absent. */
function attrValue(tag: string, attr: string): string | null {
  const match = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`, "i").exec(tag);
  return match ? match[1] : null;
}

/**
 * True if `html` has a `src=`, `srcset=`, or `<link ... href=` attribute, or
 * a CSS `url(...)` inside a `style` attribute or a `<style>` block, whose
 * value references `origin` (its full form, `https://host`, or the
 * protocol-relative `//host` form). A plain `<a href>` is deliberately not
 * checked here — that's the expected, allowed fallback link.
 */
function fetchesFromOrigin(html: string, origin: string): boolean {
  const host = new URL(origin).host;
  const originRef = `(?:${escapeRegExp(origin)}|//${escapeRegExp(host)})`;

  const attrPatterns = [
    new RegExp(`\\bsrc\\s*=\\s*"[^"]*${originRef}[^"]*"`, "i"),
    new RegExp(`\\bsrcset\\s*=\\s*"[^"]*${originRef}[^"]*"`, "i"),
    new RegExp(
      `<link\\b[^>]*\\bhref\\s*=\\s*"[^"]*${originRef}[^"]*"[^>]*>`,
      "i",
    ),
  ];
  if (attrPatterns.some((pattern) => pattern.test(html))) return true;

  const cssUrlPattern = new RegExp(
    `url\\(\\s*['"]?[^'")]*${escapeRegExp(host)}[^'")]*['"]?\\s*\\)`,
    "i",
  );
  // Any element's `style="..."` attribute value, whatever the tag name.
  for (const match of html.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) {
    if (cssUrlPattern.test(match[1])) return true;
  }
  // Every `<style>...</style>` block's CSS text.
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (cssUrlPattern.test(match[1])) return true;
  }
  return false;
}

/**
 * Asserts the one fallback `<a>` (`data-umami-event="meet-embed-fallback-click"`)
 * exists exactly once and opens the real scheduler URL safely. Doubles as the
 * "the scheduler origin actually reached this page" check that requirement 1
 * needs before the eager-fetch guard runs, since without it that guard would
 * pass vacuously against a server that never got `SCHEDULE_URL`.
 */
function assertFallbackLink(html: string, path: string, expectedHref: string) {
  const anchors = openTags(html, "a").filter((tag) =>
    attrValue(tag, "data-umami-event") === FALLBACK_EVENT
  );
  assertEquals(
    anchors.length,
    1,
    `${path}: expected exactly one fallback link (data-umami-event="${FALLBACK_EVENT}")`,
  );
  const tag = anchors[0];
  assertEquals(
    attrValue(tag, "href"),
    expectedHref,
    `${path}: fallback link href does not equal the scheduler URL`,
  );
  assertEquals(
    attrValue(tag, "target"),
    "_blank",
    `${path}: fallback link missing target="_blank"`,
  );
  assertEquals(
    attrValue(tag, "rel"),
    "noopener noreferrer",
    `${path}: fallback link missing rel="noopener noreferrer"`,
  );
}

/** Runs the full facade + fallback + no-eager-fetch guard set for one page. */
function assertBookingFacade(
  html: string,
  path: string,
  embeds: number,
  expectedScheduleUrl: string,
) {
  assertEquals(
    count(html, new RegExp(escapeRegExp(FACADE_EVENT), "g")),
    embeds,
    `${path}: expected ${embeds} facade button(s)`,
  );
  assertEquals(count(html, /<iframe\b/gi), 0, `${path}: rendered an <iframe>`);

  // Must run before the eager-fetch check: proves the scheduler origin is
  // really on the page, so "nothing fetches it" isn't checking an empty page.
  assertFallbackLink(html, path, expectedScheduleUrl);

  assert(
    !fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    `${path}: found a src/srcset/link-href/CSS-url reference to the scheduler origin before a click`,
  );
}

/**
 * Given the index of a `<div` opening tag, returns the `[start, end)` byte
 * range of the whole element (through its matching `</div>`), counting
 * nested `<div>`/`</div>` pairs so a nested `</div>` doesn't end it early.
 */
function matchDivElement(
  html: string,
  openTagStart: number,
): { start: number; end: number } {
  const openTagEnd = html.indexOf(">", openTagStart);
  assert(openTagEnd >= 0, "unterminated <div> opening tag");
  let depth = 1;
  const tagPattern = /<(\/?)div\b[^>]*>/gi;
  tagPattern.lastIndex = openTagEnd + 1;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html))) {
    if (match[1] === "/") {
      depth--;
      if (depth === 0) {
        return { start: openTagStart, end: match.index + match[0].length };
      }
    } else {
      depth++;
    }
  }
  throw new Error("no matching </div> found");
}

/** Finds the `<div class="...">` element whose class attribute is exactly `classAttr`. */
function findDivByClass(
  html: string,
  classAttr: string,
): { start: number; end: number } {
  const classIdx = html.indexOf(`class="${classAttr}"`);
  assert(classIdx >= 0, `no element found with class="${classAttr}"`);
  const tagStart = html.lastIndexOf("<div", classIdx);
  assert(tagStart >= 0, `class="${classAttr}" is not inside a <div>`);
  return matchDivElement(html, tagStart);
}

Deno.test("home page ships the booking facade and no iframe before a click", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/");
    assertBookingFacade(body, "/", 1, SCHEDULER_ORIGIN);
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("home page keeps the collapsed success panel out of the tab order", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/");
    const wrapper = findDivByClass(
      body,
      "transition-all duration-500 ease-in-out text-center",
    );
    const wrapperHtml = body.slice(wrapper.start, wrapper.end);
    const openTag = wrapperHtml.slice(0, wrapperHtml.indexOf(">") + 1);
    assert(
      /\binert\b/.test(openTag),
      "/: the collapsed success wrapper is missing the inert attribute, " +
        "so its controls stay Tab-reachable while invisible",
    );
    assert(
      wrapperHtml.includes(FACADE_EVENT),
      "/: the facade button was not found inside the success wrapper — " +
        "the inert check above would be guarding the wrong element",
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("how-i-work ships the booking facade after the FAQ, no iframe before a click", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/how-i-work");
    assertBookingFacade(body, "/how-i-work", 1, SCHEDULER_ORIGIN);

    const faqIndex = body.indexOf("Frequently Asked Questions");
    const facadeIndex = body.indexOf(FACADE_EVENT);
    assert(faqIndex >= 0, "/how-i-work: FAQ heading not found");
    assert(facadeIndex >= 0, "/how-i-work: facade button not found");
    assert(
      facadeIndex > faqIndex,
      "/how-i-work: booking facade must come after the FAQ section, so objections are cleared before the ask",
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("contact-me ships the booking facade behind #book, no iframe before a click", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/contact-me");
    assertBookingFacade(body, "/contact-me", 1, SCHEDULER_ORIGIN);

    assert(
      /<a\b[^>]*href="#book"/.test(body),
      "/contact-me: first contact card does not link to #book",
    );
    assert(
      /\bid="book"/.test(body),
      '/contact-me: no element with id="book" found',
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("meet-embed guard rejects a protocol-relative reference to the scheduler origin", () => {
  const html = `<img src="//${SCHEDULER_HOST}/pixel.gif" alt="">` +
    "<button>ok</button>";
  assert(
    fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    "fetchesFromOrigin() must catch a protocol-relative src reference",
  );
});

Deno.test("meet-embed guard rejects a CSS url() reference to the scheduler origin", () => {
  const inStyleAttr =
    `<div style="background-image:url('https://${SCHEDULER_HOST}/bg.png')"></div>`;
  const inStyleBlock =
    `<style>.x{background:url(https://${SCHEDULER_HOST}/bg.png)}</style>`;
  assert(
    fetchesFromOrigin(inStyleAttr, SCHEDULER_ORIGIN),
    "fetchesFromOrigin() must catch a CSS url() inside a style attribute",
  );
  assert(
    fetchesFromOrigin(inStyleBlock, SCHEDULER_ORIGIN),
    "fetchesFromOrigin() must catch a CSS url() inside a <style> block",
  );
});

Deno.test("meet-embed guard allows the plain fallback link and serialized island props", () => {
  const html =
    `<a href="https://${SCHEDULER_HOST}" target="_blank" rel="noopener noreferrer" ` +
    `data-umami-event="${FALLBACK_EVENT}">open standalone</a>` +
    `<script>boot({},"[[1],{\\"url\\":0},\\"https://${SCHEDULER_HOST}/embed\\"]")</script>`;
  assert(
    !fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    "fetchesFromOrigin() must not flag a plain <a href> or a serialized island prop",
  );
});
