import type { ComponentChildren } from "preact";
import { NewTabHint } from "./NewTabHint.tsx";

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
  /** Bare boolean attribute, e.g. the home page's primary CTA marker. */
  "data-primary-cta"?: boolean;
  class?: string;
  children?: ComponentChildren;
}

/**
 * A "book a call" anchor: `<a href={url}>` with the given attributes and
 * children, or nothing when `url` is empty. Every call site used to render
 * its own `<a href={SCHEDULE_URL}>` inline, which produced `href=""` — and a
 * click that just reloaded the page — whenever `SCHEDULE_URL` was unset and
 * there was no per-item override (#156).
 */
export function BookCallLink({
  url,
  target,
  rel,
  "data-umami-event": dataUmamiEvent,
  "data-e2e": dataE2e,
  "data-primary-cta": dataPrimaryCta,
  class: className,
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
      class={className}
    >
      {children}
      {target === "_blank" && <NewTabHint />}
    </a>
  );
}

export default BookCallLink;
