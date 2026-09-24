import type { ComponentChildren } from "preact";
import { NewTabHint } from "./NewTabHint.tsx";
import { buttonClass, type ButtonVariant } from "./Button.tsx";

interface BookCallLinkProps {
  /**
   * Resolved booking URL. Most callers pass `SCHEDULE_URL` directly; a
   * hackathon page passes `h.ctaLink || SCHEDULE_URL` so a per-item override
   * still renders when `SCHEDULE_URL` is unset. The link renders nothing
   * when this is empty.
   */
  url: string;
  target?: "_blank";
  rel?: string;
  "data-umami-event"?: string;
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
 * A "book a call" anchor: `<a href={url}>` with the given attributes and
 * children, or nothing when `url` is empty. Every call site used to render
 * its own `<a href={SCHEDULE_URL}>` inline, which produced `href=""` — and a
 * click that just reloaded the page — whenever `SCHEDULE_URL` was unset and
 * there was no per-item override (#156). Styling goes through
 * `components/Button.tsx`'s `buttonClass()` (#184) — the same source
 * `<Button>` itself uses — rather than each call site carrying its own copy
 * of the primary/secondary class string. A `variant="primary"` link also
 * carries `data-primary-book`, the marker
 * `test/visual-system.browser.test.ts`'s accent-usage guard looks for.
 */
export function BookCallLink({
  url,
  target,
  rel,
  "data-umami-event": dataUmamiEvent,
  "data-e2e": dataE2e,
  "data-primary-cta": dataPrimaryCta,
  variant = "primary",
  class: extraClass,
  children,
}: BookCallLinkProps) {
  if (!url) return null;
  return (
    <a
      href={url}
      target={target}
      rel={rel}
      data-umami-event={dataUmamiEvent}
      data-e2e={dataE2e}
      data-primary-cta={dataPrimaryCta}
      {...(variant === "primary" ? { "data-primary-book": true } : {})}
      class={buttonClass(variant, extraClass)}
    >
      {children}
      {target === "_blank" && <NewTabHint />}
    </a>
  );
}

export default BookCallLink;
