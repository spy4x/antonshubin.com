import { navLabel } from "../lib/nav.ts";

interface Crumb {
  name: string;
  href?: string;
}

/**
 * The back link on a page two levels deep (#293): "‹ Writing" on a post,
 * "‹ Work" on a case study. It takes the parent from the trail's second to
 * last item and the label from the nav (`lib/nav.ts`'s `navLabel()`), so it
 * says "Writing" where the URL says `/blog`. A parent the nav doesn't list
 * (`/hackathons`) keeps the trail's own name. On a top-level page it renders
 * nothing: the H1 already names the page and the portrait links home. Every
 * page keeps its `BreadcrumbList` JSON-LD for search (`lib/head.ts`).
 *
 * Every nested page puts it first in its content column, so it sits in the
 * same spot everywhere; the 40px minimum height is its tap area.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length <= 2) return null;
  const parent = items[items.length - 2];
  if (!parent.href) return null;

  return (
    <nav aria-label="Breadcrumb" class="mb-4 text-sm">
      <a
        href={parent.href}
        class="inline-flex min-h-10 items-center gap-1 text-graphite hover:text-parchment"
      >
        <span aria-hidden="true">‹</span>
        {navLabel(parent.href) ?? parent.name}
      </a>
    </nav>
  );
}
