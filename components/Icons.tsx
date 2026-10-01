import {
  IconBriefcase,
  IconRocket,
  IconSearch,
  IconStar,
  IconTarget,
} from "@spy4x/preact-icons";
import type { CatalogIconName } from "../lib/catalog.ts";

/**
 * The library's star, filled with the text colour when `filled` (a review's
 * rating, a repository's stars). `fill-current` beats the SVG's own
 * `fill="none"` attribute, because CSS wins over a presentation attribute.
 */
export function StarIcon(
  { class: className = "", filled = false }: {
    class?: string;
    filled?: boolean;
  },
) {
  return <IconStar class={filled ? `fill-current ${className}` : className} />;
}

/** Renders a catalog item's icon by name (#184) — see `CatalogIconName`. */
export function CatalogIcon(
  { name, class: className }: { name: CatalogIconName; class?: string },
) {
  switch (name) {
    case "target":
      return <IconTarget class={className} />;
    case "search":
      return <IconSearch class={className} />;
    case "rocket":
      return <IconRocket class={className} />;
    case "briefcase":
      return <IconBriefcase class={className} />;
  }
}
