import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface TocItem {
  id: string;
  text: string;
}

/**
 * A long post's "On this page" list (#274, UX 3): its `h2` headings as
 * links, server-rendered, so it works as plain links without JS. Once
 * hydrated, one `IntersectionObserver` marks the section being read with
 * `aria-current="location"`. No progress bar (Psych 4).
 */
export default function PostToc({ items }: { items: TocItem[] }) {
  const current = useSignal<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0 || !("IntersectionObserver" in globalThis)) {
      return;
    }
    // A heading counts as current once it crosses the top fifth of the
    // screen, and stays current until the next one does.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) current.value = entry.target.id;
        }
      },
      { rootMargin: "0px 0px -80% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <ol class="post-toc">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={current.value === item.id ? "location" : undefined}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
