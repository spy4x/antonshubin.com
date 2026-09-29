// Guards for issue #111, #152 and #272: the booking calendar on `/`,
// `/how-i-work` and `/contact-me`. Since #272 there is no click-to-load
// button: the server renders a reserved placeholder (`data-meet-embed`) and
// the island inserts the iframe after hydration. Four things are guarded per
// page:
//  1. The placeholder (where the page shows one) and the new-tab link both
//     exist, and the link's `href` really is the scheduler's URL — this must
//     run before the "nothing fetches the origin" check below, otherwise that
//     check passes vacuously when `SCHEDULE_URL` never reached the server.
//  2. The server HTML holds no `<iframe>`, and nothing that makes a browser
//     fetch eagerly (`src`, `srcset`, `<link href>`, a protocol-relative
//     reference, or a CSS `url(...)`) points at the scheduler's origin. A
//     plain `<a href>` is allowed, so is the URL inside Fresh's serialized
//     island props, and on `/contact-me` only, one `<link rel="preconnect">`.
//  3. On `/`, the collapsed success panel carries `inert` and holds no
//     calendar: the calendar mounts only after a successful submit, so a home
//     page view never loads the scheduler.
//  4. With `SCHEDULE_URL` unset, every booking block (placeholder, new-tab
//     link, and on `/contact-me` the `#book` section) is absent rather than
//     rendering a dead end: an empty-`href` link or a heading with nothing
//     under it.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count } from "./html.ts";
import {
  embedUrl,
  isEmbedHeightMessage,
  MAX_EMBED_HEIGHT_PX,
} from "../islands/MeetEmbed.tsx";

const SCHEDULER_ORIGIN = "https://meet.example.com";
const SCHEDULER_HOST = "meet.example.com";
/** The calendar's wrapper, `data-meet-embed="<state>"`; not the `-placeholder` child. */
const EMBED_MARKER = /data-meet-embed="/g;
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

/** Runs the full placeholder + new-tab link + no-eager-fetch guard set for one page. */
function assertBookingPlaceholder(
  html: string,
  path: string,
  embeds: number,
  expectedScheduleUrl: string,
) {
  assertEquals(
    count(html, EMBED_MARKER),
    embeds,
    `${path}: expected ${embeds} calendar placeholder(s)`,
  );
  assertEquals(count(html, /<iframe\b/gi), 0, `${path}: rendered an <iframe>`);

  // Must run before the eager-fetch check: proves the scheduler origin is
  // really on the page, so "nothing fetches it" isn't checking an empty page.
  assertFallbackLink(html, path, expectedScheduleUrl);

  assert(
    !fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    `${path}: found a src/srcset/link-href/CSS-url reference to the scheduler origin in the server HTML`,
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

/**
 * Finds the `<div ...>` element carrying the given boolean/string attribute
 * (matched by name only, not value — `data-lead-success="true"` and a bare
 * `data-lead-success` both match). Keyed on a stable `data-` attribute
 * rather than a Tailwind class string, so a styling change to the element
 * can't break this lookup and produce a misleading "no element found"
 * failure instead of a real guard result.
 */
function findDivByAttr(
  html: string,
  attr: string,
): { start: number; end: number } {
  const match = new RegExp(`<div\\b[^>]*\\b${attr}\\b[^>]*>`, "i").exec(html);
  assert(match, `no <div> found with attribute "${attr}"`);
  return matchDivElement(html, match.index);
}

/**
 * True if `html` contains an `<a>` whose `href` is empty (`href=""`) or a
 * bare attribute with no value at all — the shape the fallback and
 * standalone links would take if `SCHEDULE_URL` reached the page unset.
 */
function hasEmptyHrefAnchor(html: string): boolean {
  return openTags(html, "a").some((tag) =>
    /\bhref\s*=\s*""/.test(tag) || /\bhref\b(?!\s*=)/.test(tag)
  );
}

/**
 * Asserts the calendar placeholder, its new-tab link, and any empty-href anchor
 * are all absent — the guard for a misconfigured environment where
 * `SCHEDULE_URL` is unset. Each absence checked here has a matching
 * presence assertion in a set-case test above, so this can't pass
 * vacuously against a page that never had the block to begin with.
 */
function assertNoBookingBlock(html: string, path: string) {
  assertEquals(
    count(html, EMBED_MARKER),
    0,
    `${path}: rendered the calendar placeholder with SCHEDULE_URL unset`,
  );
  assertEquals(
    count(html, /<iframe\b/gi),
    0,
    `${path}: rendered an <iframe> with SCHEDULE_URL unset`,
  );
  assertEquals(
    count(html, new RegExp(escapeRegExp(FALLBACK_EVENT), "g")),
    0,
    `${path}: rendered the new-tab link with SCHEDULE_URL unset`,
  );
  assert(
    !hasEmptyHrefAnchor(html),
    `${path}: rendered an <a> with an empty href with SCHEDULE_URL unset`,
  );
}

// A schemeless SCHEDULE_URL (a plausible config typo — "meet.example.com"
// instead of "https://meet.example.com") must not 500 the pages that render
// the booking calendar. `embedUrl()` still builds a URL from it (schemeless,
// so browser-side it resolves wrong — a separate, pre-existing concern, not
// this test's point); MeetEmbed must not *throw* rendering it, server-side
// or client-side.
const SCHEMELESS_SCHEDULE_URL = "meet.example.com";

Deno.test("/ renders 200, not 500, when SCHEDULE_URL has no scheme", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEMELESS_SCHEDULE_URL);
  const site = await startSite();
  try {
    const res = await site.get("/");
    assertEquals(res.status, 200);
    await res.body?.cancel();
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("home page ships no calendar, no iframe and no scheduler request before a submit", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/");
    assertBookingPlaceholder(body, "/", 0, SCHEDULER_ORIGIN);
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
    const wrapper = findDivByAttr(body, "data-lead-success");
    const wrapperHtml = body.slice(wrapper.start, wrapper.end);
    const openTag = wrapperHtml.slice(0, wrapperHtml.indexOf(">") + 1);
    assert(
      /\binert\b/.test(openTag),
      "/: the collapsed success wrapper is missing the inert attribute, " +
        "so its controls stay Tab-reachable while invisible",
    );
    assert(
      wrapperHtml.includes(FALLBACK_EVENT),
      "/: the new-tab link was not found inside the success wrapper — " +
        "the inert check above would be guarding the wrong element",
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("how-i-work ships the calendar placeholder after the FAQ, no iframe in the HTML", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/how-i-work");
    assertBookingPlaceholder(body, "/how-i-work", 1, SCHEDULER_ORIGIN);

    const faqIndex = body.indexOf("Frequently Asked Questions");
    const embedIndex = body.search(EMBED_MARKER);
    assert(faqIndex >= 0, "/how-i-work: FAQ heading not found");
    assert(embedIndex >= 0, "/how-i-work: calendar placeholder not found");
    assert(
      embedIndex > faqIndex,
      "/how-i-work: the calendar must come after the FAQ section, so objections are cleared before the ask",
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("contact-me ships the calendar placeholder in #book, a preconnect and no iframe", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/contact-me");
    // The one allowed reference: a preconnect, which opens a connection but
    // fetches nothing. Checked, then removed before the eager-fetch guard.
    const preconnect = `<link rel="preconnect" href="${SCHEDULER_ORIGIN}"/>`;
    assertEquals(
      count(body, new RegExp(escapeRegExp(preconnect), "g")),
      1,
      "/contact-me: expected one preconnect to the scheduler's origin",
    );
    assertBookingPlaceholder(
      body.replace(preconnect, ""),
      "/contact-me",
      1,
      SCHEDULER_ORIGIN,
    );

    const book = /<section\b[^>]*\bid="book"[^>]*>/.exec(body);
    assert(book, '/contact-me: no section with id="book" found');
    assert(
      body.search(EMBED_MARKER) > book.index,
      "/contact-me: the calendar placeholder is not inside #book",
    );
  } finally {
    await site.stop();
    if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
    else Deno.env.set("SCHEDULE_URL", previous);
  }
});

// Scoped to the LeadForm success wrapper only. The home page also has two
// other `href={SCHEDULE_URL}` CTAs (`hero-book-call`, `home-book-call` in
// routes/index.tsx) that render an empty href when unset too, but fixing
// those is a separate, tracked follow-up, not part of this guard.
Deno.test("lead form success panel renders no booking block when SCHEDULE_URL is unset", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.delete("SCHEDULE_URL");
  const site = await startSite();
  try {
    const body = await site.html("/");
    const wrapper = findDivByAttr(body, "data-lead-success");
    const wrapperHtml = body.slice(wrapper.start, wrapper.end);
    assertNoBookingBlock(wrapperHtml, "/ (LeadForm success panel)");
  } finally {
    await site.stop();
    if (previous !== undefined) Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("how-i-work renders no booking block when SCHEDULE_URL is unset", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.delete("SCHEDULE_URL");
  const site = await startSite();
  try {
    const body = await site.html("/how-i-work");
    assertNoBookingBlock(body, "/how-i-work");
  } finally {
    await site.stop();
    if (previous !== undefined) Deno.env.set("SCHEDULE_URL", previous);
  }
});

Deno.test("contact-me renders no #book section, link or preconnect when SCHEDULE_URL is unset", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.delete("SCHEDULE_URL");
  const site = await startSite();
  try {
    const body = await site.html("/contact-me");
    assertNoBookingBlock(body, "/contact-me");
    assert(
      !/\bid="book"/.test(body),
      '/contact-me: found id="book" with SCHEDULE_URL unset',
    );
    assert(
      !/href="#book"/.test(body),
      "/contact-me: a link still points at #book with SCHEDULE_URL unset",
    );
    assert(
      !/rel="preconnect"/.test(body),
      "/contact-me: still preconnects to a scheduler with SCHEDULE_URL unset",
    );
  } finally {
    await site.stop();
    if (previous !== undefined) Deno.env.set("SCHEDULE_URL", previous);
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

Deno.test("embedUrl appends ?theme=dark and strips a trailing slash", () => {
  assertEquals(
    embedUrl("https://meet.example.com"),
    "https://meet.example.com/embed?theme=dark",
  );
  assertEquals(
    embedUrl("https://meet.example.com/"),
    "https://meet.example.com/embed?theme=dark",
  );
  assertEquals(
    embedUrl("https://meet.example.com///"),
    "https://meet.example.com/embed?theme=dark",
  );
});

Deno.test("embedUrl returns empty string when scheduleUrl is empty", () => {
  assertEquals(embedUrl(""), "");
});

// isEmbedHeightMessage(): the mig:height postMessage filter. Each case below
// starts from one valid message and breaks exactly one condition, so a
// regression in any single check shows up as its own failing test.
const ORIGIN = "https://meet.example.com";
const SOURCE = { name: "iframe-window" } as unknown as Window;
const OTHER_SOURCE = { name: "other-window" } as unknown as Window;

function validEvent(
  overrides: Partial<{ origin: string; source: Window; data: unknown }> = {},
): Pick<MessageEvent, "origin" | "source" | "data"> {
  return {
    origin: ORIGIN,
    source: SOURCE,
    data: { type: "mig:height", height: 900 },
    ...overrides,
  };
}

Deno.test("isEmbedHeightMessage accepts a valid mig:height message", () => {
  assertEquals(isEmbedHeightMessage(validEvent(), ORIGIN, SOURCE), 900);
});

Deno.test("isEmbedHeightMessage rejects the wrong origin", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ origin: "https://evil.example.com" }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects the wrong source window", () => {
  assertEquals(
    isEmbedHeightMessage(validEvent({ source: OTHER_SOURCE }), ORIGIN, SOURCE),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a missing iframe window", () => {
  assertEquals(isEmbedHeightMessage(validEvent(), ORIGIN, null), null);
  assertEquals(isEmbedHeightMessage(validEvent(), ORIGIN, undefined), null);
});

Deno.test("isEmbedHeightMessage rejects a null data payload", () => {
  assertEquals(
    isEmbedHeightMessage(validEvent({ data: null }), ORIGIN, SOURCE),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects the wrong message type", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "not-mig-height", height: 900 } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a non-numeric height", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: "900" } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a NaN or Infinity height", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: NaN } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: Infinity } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a zero height", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: 0 } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a negative height", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: -10 } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

Deno.test("isEmbedHeightMessage rejects a non-integer height", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: 900.5 } }),
      ORIGIN,
      SOURCE,
    ),
    null,
  );
});

// A height over the cap is clamped, not rejected: mig's real height is
// content the visitor needs (large system text, a validation error), so
// rejecting it outright would leave the frame at an earlier step's height,
// with most of the page scrolling inside it — worse than a frame capped at
// a generous but finite height (see MAX_EMBED_HEIGHT_PX's own comment for
// the real heights this is based on, up to 1482px at 320px/125% text).
Deno.test("isEmbedHeightMessage clamps a height over the cap instead of rejecting it", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({ data: { type: "mig:height", height: 5000 } }),
      ORIGIN,
      SOURCE,
    ),
    MAX_EMBED_HEIGHT_PX,
  );
  assertEquals(MAX_EMBED_HEIGHT_PX, 2000);
});

Deno.test("isEmbedHeightMessage returns a height exactly at the cap unchanged", () => {
  assertEquals(
    isEmbedHeightMessage(
      validEvent({
        data: { type: "mig:height", height: MAX_EMBED_HEIGHT_PX },
      }),
      ORIGIN,
      SOURCE,
    ),
    MAX_EMBED_HEIGHT_PX,
  );
});

Deno.test("meet-embed guard allows the plain fallback link and serialized island props", () => {
  const html =
    `<a href="https://${SCHEDULER_HOST}" target="_blank" rel="noopener noreferrer" ` +
    `data-umami-event="${FALLBACK_EVENT}">Open the calendar in a new tab</a>` +
    `<script>boot({},"[[1],{\\"url\\":0},\\"https://${SCHEDULER_HOST}/embed\\"]")</script>`;
  assert(
    !fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    "fetchesFromOrigin() must not flag a plain <a href> or a serialized island prop",
  );
});
