import { NavGlyph } from "./Icons.tsx";
import { NewTabHint } from "./NewTabHint.tsx";
import { linkGroups, type NavIcon } from "../lib/nav.ts";

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

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

/** The Links groups, shared by the desktop popover and the phone sheet. */
export function LinkGroups({ idPrefix }: { idPrefix: string }) {
  return (
    <div class="space-y-3">
      {linkGroups.map((group) => {
        const id = `${idPrefix}-${group.label.toLowerCase()}`;
        return (
          <div key={group.label}>
            <p id={id} class="px-3 pb-1 text-xs text-graphite">
              {group.label}
            </p>
            <ul aria-labelledby={id}>
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target={isExternal(link.href) ? "_blank" : undefined}
                    rel={isExternal(link.href)
                      ? "noopener noreferrer"
                      : undefined}
                    class={`block rounded-lg px-3 py-2 text-sm text-parchment hover:bg-paper ${FOCUS}`}
                  >
                    {link.label}
                    {isExternal(link.href) && <NewTabHint />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
