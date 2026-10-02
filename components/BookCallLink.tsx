import type { ComponentChildren } from "preact";
import Button, { type ButtonVariant } from "./Button.tsx";
import { type EventAttrs, eventAttrs } from "../lib/analytics.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { BOOK_HREF } from "../lib/nav.ts";

interface BookCallLinkProps {
  /**
   * Where the link goes: `/book` (`BOOK_HREF`), in the same tab, when omitted.
   * Omitted, the link renders nothing while `SCHEDULE_URL` is unset, because
   * there is no calendar to book. A page that passes its own target (the
   * `/book` link on `/how-i-work`, a hackathon's own call to action) always
   * renders it.
   */
  href?: string;
  /** The Umami event and its properties (`eventAttrs()`); a bare `book` when omitted. */
  event?: EventAttrs;
  "data-e2e"?: string;
  /** Bare boolean attribute marking the home page's one primary CTA —
   * `test/structure.test.ts` counts it, separately from `data-primary-book`
   * below (every primary-styled Book link gets that one; only the home
   * page's bottom CTA gets this one). */
  "data-primary-cta"?: boolean;
  /**
   * `"primary"` (the default): the site's one filled-Accent action, Ink
   * text — this is the Book action, so it's what nearly every call site
   * wants. `"secondary"`: an outline button, for the rare page that shows a
   * second, less prominent way to book alongside the primary one (see
   * routes/hackathons/[slug].tsx).
   */
  variant?: ButtonVariant;
  /** Page-specific layout classes (icon gap, padding, text size) appended
   * to the variant's own class string — never a colour override. */
  class?: string;
  children?: ComponentChildren;
}

/**
 * A "book a call" anchor to `/book`, where every Book ends (#387, #272): the
 * page shows the calendar, "After the call" and the brief, and its island
 * counts the booking. It never opens the scheduler directly or in a new tab.
 * Renders nothing when there is no `href` and `SCHEDULE_URL` is unset (#156:
 * the old `href=""` reloaded the page). It renders the site's `Button`
 * (`components/Button.tsx`, the library button since #371), which also
 * stamps `data-primary-book` on a `variant="primary"` link, the marker
 * `test/visual-system.browser.test.ts`'s accent-usage guard looks for.
 */
export function BookCallLink({
  href,
  event = eventAttrs("book"),
  "data-e2e": dataE2e,
  "data-primary-cta": dataPrimaryCta,
  variant = "primary",
  class: extraClass,
  children,
}: BookCallLinkProps) {
  if (href === undefined && !SCHEDULE_URL) return null;
  return (
    <Button
      href={href ?? BOOK_HREF}
      {...event}
      data-e2e={dataE2e}
      data-primary-cta={dataPrimaryCta}
      variant={variant}
      class={extraClass}
    >
      {children}
    </Button>
  );
}

export default BookCallLink;
