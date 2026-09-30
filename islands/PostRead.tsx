import { useEffect, useRef } from "preact/hooks";
import { track } from "../lib/analytics.ts";

/** How long a visitor must have been on the post before it counts as read. */
export const POST_READ_MIN_MS = 15_000;

/**
 * Counts `post-read` once per view (#318): when the end of the post's body
 * has been on screen and the visitor has been on the page for
 * `POST_READ_MIN_MS` or more, in either order. It renders a 1px marker right
 * after the body, so a reader who scrolls past the last paragraph counts and
 * one who only opens the page does not. Time is measured from navigation
 * start (`performance.now()`).
 */
export default function PostRead({ slug }: { slug: string }) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !("IntersectionObserver" in globalThis)) return;
    let seen = false;
    let sent = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (sent || !seen) return;
      const waited = performance.now();
      if (waited < POST_READ_MIN_MS) {
        clearTimeout(timer);
        timer = setTimeout(check, POST_READ_MIN_MS - waited);
        return;
      }
      sent = true;
      observer.disconnect();
      track("post-read", { item: slug });
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        seen = true;
        check();
      }
    });
    observer.observe(marker);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [slug]);

  return <div ref={markerRef} data-post-end aria-hidden="true" />;
}
