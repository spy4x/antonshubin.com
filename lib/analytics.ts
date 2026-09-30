/**
 * The site's one list of Umami events (#318) and the only code that talks to
 * Umami. A link or button gets its event through `eventAttrs()`, spread onto
 * the element; an island reports an outcome through `track()`. Event names
 * are a closed list, so a typo fails type checking, and detail goes into
 * properties (`data-umami-event-<key>`) instead of into the name, so Umami can
 * add up "every Book click" across pages. Umami stores the page URL with each
 * event, so no property repeats it.
 */

/** Every event the site sends, in the order of the table in #318. */
export const ANALYTICS_EVENTS = [
  "book",
  "brief",
  "brief-sent",
  "brief-error",
  "call-booked",
  "calendar-shown",
  "calendar-failed",
  "newsletter-signup",
  "outbound",
  "cta",
  "tool-install-copy",
  "copy",
  "post-read",
  "not-found",
] as const;

/** One of `ANALYTICS_EVENTS`. */
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[number];

/**
 * Where on the page a link sits: the nav, the first screen (`hero`), a fact
 * or price card (`card`), the closing band (`band`), a post's side column
 * (`side`), the end of a post (`end`), a line at the top of the main column
 * (`top`), the booking calendar's box and its new-tab link (`calendar`), or
 * anywhere else in the page's own text (`body`).
 */
export const PLACES = [
  "nav",
  "hero",
  "card",
  "band",
  "side",
  "end",
  "top",
  "calendar",
  "body",
] as const;

/** One of `PLACES`. */
export type Place = typeof PLACES[number];

/** Why a brief did not go through: the form refused it, or the server did. */
export type BriefErrorReason = "invalid" | "server";

/** The properties an event can carry; each becomes `data-umami-event-<key>`. */
export interface EventProps {
  place?: Place;
  /** The catalog item, project, tool or post the link is about. */
  item?: string;
  /** `outbound` only: a short name for where the link goes (`upwork`, `github`, `live` …). */
  to?: string;
  /** `cta` only: the internal path the link opens. */
  target?: string;
  /** `copy` only: which field was copied. */
  field?: string;
  /** `brief-error` only. */
  reason?: BriefErrorReason;
  /** `brief-sent` only: the catalog slug a prefilled brief was about. */
  service?: string;
}

/** The attributes `eventAttrs()` returns, ready to spread onto an element. */
export type EventAttrs =
  & { "data-umami-event": AnalyticsEvent }
  & { [key: `data-umami-event-${string}`]: string };

/**
 * The `data-umami-event` attribute and one `data-umami-event-<key>` per set
 * property, for Umami's own click tracking. Unset properties are left out.
 */
export function eventAttrs(
  name: AnalyticsEvent,
  props: EventProps = {},
): EventAttrs {
  const attrs: EventAttrs = { "data-umami-event": name };
  for (const [key, value] of Object.entries(props)) {
    if (value) attrs[`data-umami-event-${key}`] = String(value);
  }
  return attrs;
}

/** Short `to` names for the hosts the site links to most. */
const OUTBOUND_NAMES: Record<string, string> = {
  "github.com": "github",
  "upwork.com": "upwork",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "t.me": "telegram",
  "neatsoft.dev": "neatsoft",
  "linkedin.com": "linkedin",
  "x.com": "x",
  "twitter.com": "x",
  "dev.to": "devto",
  "jsr.io": "jsr",
  "npmjs.com": "npm",
};

/** This site's own hosts: a link to one of them is not outbound. */
const OWN_HOSTS = ["antonshubin.com", "www.antonshubin.com"];

/**
 * The `to` property for a link to another site: `email` for `mailto:`, a
 * short name from `OUTBOUND_NAMES`, the first label of one of this site's
 * subdomains (`dash`, `meet`), or else the host without `www.`. Null for
 * a link that stays on this site (a path, a fragment, or this site's host).
 */
export function outboundTo(href: string): string | null {
  if (href.startsWith("mailto:")) return "email";
  if (!/^https?:\/\//i.test(href)) return null;
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (OWN_HOSTS.includes(host)) return null;
  const bare = host.replace(/^www\./, "");
  if (bare.endsWith(`.${OWN_HOSTS[0]}`)) return bare.split(".")[0];
  return OUTBOUND_NAMES[bare] ?? bare;
}

/** The written brief: on the booking page, or the home page's form. */
const BRIEF_HREF = /^\/(?:contact-me(?:\?[^#]*)?#brief|#audit-form)$/;
/** The booking page itself. */
const BOOK_HREF = /^\/contact-me(?:\?[^#]*)?$/;

/**
 * The event for a link given only its `href`: `outbound` (with `to` and
 * `item`) for another site, `brief` or `book` (with `place` and `item`) for
 * the brief or the booking page, and `cta` (with `place` and `target`) for
 * any other page here. `to` overrides the name `outboundTo()` would pick.
 */
export function linkEvent(
  href: string,
  props: Pick<EventProps, "place" | "item" | "to"> = {},
): EventAttrs {
  const to = outboundTo(href);
  if (to) {
    return eventAttrs("outbound", { to: props.to ?? to, item: props.item });
  }
  const place = props.place ?? "body";
  if (BRIEF_HREF.test(href)) {
    return eventAttrs("brief", { place, item: props.item });
  }
  if (BOOK_HREF.test(href)) {
    return eventAttrs("book", { place, item: props.item });
  }
  return eventAttrs("cta", { place, target: href });
}

/** Umami's tracker, when the page loaded it (never for crawlers, `/pay` or `/unsubscribe`). */
interface UmamiGlobal {
  umami?: { track?: (name: string, data?: Record<string, string>) => void };
}

/**
 * Sends `name` to Umami. Does nothing when the tracker is absent (blocked, a
 * crawler, a page without it) and never throws: analytics never breaks a
 * page. Unset properties are left out, as in `eventAttrs()`.
 */
export function track(name: AnalyticsEvent, props: EventProps = {}): void {
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value) data[key] = String(value);
  }
  try {
    const umami = (globalThis as UmamiGlobal).umami;
    if (Object.keys(data).length > 0) umami?.track?.(name, data);
    else umami?.track?.(name);
  } catch {
    // Analytics is fail-open.
  }
}

/**
 * `track()`, or, when the tracker has not run yet, the same call once the
 * page's `load` event fires. For an event sent as a page opens (`not-found`),
 * where an island can hydrate before a slow tracker script.
 */
export function trackWhenReady(
  name: AnalyticsEvent,
  props: EventProps = {},
): void {
  if ((globalThis as UmamiGlobal).umami || document.readyState === "complete") {
    track(name, props);
    return;
  }
  globalThis.addEventListener("load", () => track(name, props), {
    once: true,
  });
}

/**
 * Pages that never load the tracker: `/unsubscribe` carries a working
 * unsubscribe token in its URL, `/subscribe/confirm` a confirmation token that
 * holds the address, and `/pay` holds bank details. Umami stores the full URL
 * of every page view.
 */
export const UNTRACKED_PATHS = ["/unsubscribe", "/subscribe/confirm", "/pay"];

/** False for a path in `UNTRACKED_PATHS`, with or without a trailing slash. */
export function analyticsAllowed(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return !UNTRACKED_PATHS.includes(path);
}
