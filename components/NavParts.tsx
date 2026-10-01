import type { NavIcon } from "../lib/nav.ts";

/**
 * Pieces shared by the server-rendered nav (`components/Nav.tsx`) and the
 * More island (`islands/NavMore.tsx`), #185.
 */

// Item layout, states, Book and focus live in assets/styles.css's `.nav-*`
// classes (see the comment there for why they aren't utility strings).
export const FOCUS = "nav-focus";
export const STATES = "nav-state";
export const STACKED = "nav-stack";
export const BOOK = "nav-book";

export function navIcon(name: NavIcon) {
  return <NavGlyph name={name} />;
}

/**
 * The navigation's icons (#185), drawn on a 24px grid with a 2px stroke. Each
 * is one short path, and the stroke, size and colour come from the `.nav-icon`
 * class in assets/styles.css rather than per-icon attributes: the nav repeats
 * these on every page, and every byte of its markup competes with the home
 * page's LCP image on a slow connection.
 */
const NAV_GLYPHS = {
  work:
    "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  services: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  how: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18",
  tools:
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z",
  writing: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  home:
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  about: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  infrastructure: "M2 4h20v6H2zM2 14h20v6H2zM6 7h.01M6 17h.01",
  book: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
  write: "M2 5h20v14H2zM2 6l10 7 10-7",
  more: "M4 6h16M4 12h16M4 18h16",
  close: "M18 6 6 18M6 6l12 12",
} as const;

export type NavGlyphName = keyof typeof NAV_GLYPHS;

export function NavGlyph({ name }: { name: NavGlyphName }) {
  return (
    <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={NAV_GLYPHS[name]} />
    </svg>
  );
}
