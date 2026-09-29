import { NavGlyph } from "./Icons.tsx";
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
