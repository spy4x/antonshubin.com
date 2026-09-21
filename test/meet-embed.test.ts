// Guards for issue #111: the inline scheduler facade on `/`, `/how-i-work`
// and `/contact-me`. The facade's one hard requirement is that nothing is
// requested from the scheduler's origin before a visitor clicks — no
// `<iframe>`, no `src`/`srcset` pointing at it, no `<link>` preconnect/prefetch
// to it. A plain `<a href>` fallback link to the standalone scheduler is
// expected and allowed, and so is the URL turning up inside Fresh's
// serialized island-hydration props (confirmed present in the built HTML for
// `/how-i-work` and `/contact-me`; it never renders as a fetchable attribute).
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count } from "./html.ts";

const SCHEDULER_ORIGIN = "https://meet.example.com";
const FACADE_EVENT = 'data-umami-event="meet-embed-click-to-load"';

/** Escapes regex metacharacters so a literal string can go inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True if `html` has a `src=`, `srcset=`, or `<link ... href=` attribute
 * whose value contains `origin` — the set of attributes a browser fetches
 * eagerly (or preconnects/prefetches for) without any user interaction. A
 * plain `<a href>` is deliberately not checked here: that's the expected,
 * allowed fallback link.
 */
function fetchesFromOrigin(html: string, origin: string): boolean {
  const escaped = escapeRegExp(origin);
  const patterns = [
    new RegExp(`\\bsrc\\s*=\\s*"[^"]*${escaped}[^"]*"`, "i"),
    new RegExp(`\\bsrcset\\s*=\\s*"[^"]*${escaped}[^"]*"`, "i"),
    new RegExp(
      `<link\\b[^>]*\\bhref\\s*=\\s*"[^"]*${escaped}[^"]*"[^>]*>`,
      "i",
    ),
  ];
  return patterns.some((pattern) => pattern.test(html));
}

/** Runs the shared facade + no-iframe + no-eager-fetch checks for one page. */
function assertFacadeAndNoIframe(html: string, path: string, embeds: number) {
  assertEquals(
    count(html, new RegExp(escapeRegExp(FACADE_EVENT), "g")),
    embeds,
    `${path}: expected ${embeds} facade button(s)`,
  );
  assertEquals(count(html, /<iframe\b/gi), 0, `${path}: rendered an <iframe>`);
  assert(
    !fetchesFromOrigin(html, SCHEDULER_ORIGIN),
    `${path}: found a src/srcset/link-href pointing at the scheduler origin before a click`,
  );
}

Deno.test("home page ships the booking facade and no iframe before a click", async () => {
  const previous = Deno.env.get("SCHEDULE_URL");
  Deno.env.set("SCHEDULE_URL", SCHEDULER_ORIGIN);
  const site = await startSite();
  try {
    const body = await site.html("/");
    assertFacadeAndNoIframe(body, "/", 1);
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
    assertFacadeAndNoIframe(body, "/how-i-work", 1);

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
    assertFacadeAndNoIframe(body, "/contact-me", 1);

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
