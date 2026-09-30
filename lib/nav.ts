/**
 * The site's navigation destinations (#185): the one place a nav label or
 * href is written. `components/Nav.tsx` renders the desktop rail and the
 * phone tab bar, `islands/NavMore.tsx` the phone "More" sheet and
 * `components/Footer.tsx` its "Site" group, from these lists, so changing a
 * destination (#188 moves Work to `/work`) is one edit here. Profiles and
 * feeds are not destinations: they live in `lib/profiles.ts` and the footer.
 */

/** The item icons; each names a glyph in `components/Icons.tsx`'s `NavGlyph`. */
export type NavIcon =
  | "work"
  | "services"
  | "how"
  | "tools"
  | "writing"
  | "home"
  | "about"
  | "infrastructure";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

const WORK: NavItem = { href: "/work", label: "Work", icon: "work" };
const SERVICES: NavItem = {
  href: "/catalog",
  label: "Services",
  icon: "services",
};
const HOW_I_WORK: NavItem = {
  href: "/how-i-work",
  label: "How I work",
  icon: "how",
};
const TOOLS: NavItem = { href: "/tools", label: "Tools", icon: "tools" };
const WRITING: NavItem = { href: "/blog", label: "Writing", icon: "writing" };
const HOME: NavItem = { href: "/", label: "Home", icon: "home" };
const ABOUT: NavItem = { href: "/about", label: "About", icon: "about" };
const INFRASTRUCTURE: NavItem = {
  href: "/infrastructure",
  label: "Infrastructure",
  icon: "infrastructure",
};

/** The desktop rail's middle list, top to bottom (Home and Book sit above it). */
export const railItems: NavItem[] = [
  WORK,
  SERVICES,
  HOW_I_WORK,
  TOOLS,
  WRITING,
];

/** The phone tab bar: these two, then Book in the centre, then these, then More. */
export const tabItemsBeforeBook: NavItem[] = [WORK, SERVICES];
export const tabItemsAfterBook: NavItem[] = [TOOLS];

/** What the phone "More" sheet lists: pages only. */
export const moreItems: NavItem[] = [
  HOME,
  ABOUT,
  HOW_I_WORK,
  WRITING,
  INFRASTRUCTURE,
];

const allItems: NavItem[] = [
  HOME,
  WORK,
  SERVICES,
  HOW_I_WORK,
  TOOLS,
  WRITING,
  ABOUT,
  INFRASTRUCTURE,
];

/**
 * Where Book goes: the booking page, with the calendar on it (#293). When
 * `SCHEDULE_URL` is unset the button reads "Write" and goes to that page's
 * written brief (`routes/book.tsx`'s `#brief`).
 */
export const BOOK_HREF = "/book";
export const WRITE_FALLBACK_HREF = `${BOOK_HREF}#brief`;

/**
 * The nav's own word for a section, given the section's path: "Writing" for
 * `/blog`, "Services" for `/catalog`. The back link on a nested page
 * (`components/Breadcrumb.tsx`) uses it, so it never says "Blog" where the
 * nav says "Writing". `undefined` for a path the nav doesn't list.
 */
export function navLabel(href: string): string | undefined {
  return allItems.find((item) => item.href === href)?.label;
}

/**
 * The nav item whose section `pathname` is inside (`/blog/x` and `/blog`
 * both give Writing), or `undefined`. Home never matches: every path is
 * under `/`. The 404 page uses it to put the section's button first.
 */
export function navItemFor(pathname: string): NavItem | undefined {
  const trimmed = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  return allItems.find((item) =>
    item.href !== "/" &&
    (trimmed === item.href || trimmed.startsWith(`${item.href}/`))
  );
}

/** The footer's "Site" group: every page the nav lists except Home. */
export const siteItems: NavItem[] = [
  ...railItems,
  INFRASTRUCTURE,
  ABOUT,
];

/**
 * The `aria-current` value for a nav link to `href` on `currentPath`: `"page"`
 * on the page itself, `"true"` anywhere under it, `"false"` otherwise. The
 * same matching Fresh's renderer applies on the server, except that `/` is
 * only ever the page itself: Fresh marks every link to `/` as the current
 * section on every page. Used for links to `/` in `components/Nav.tsx` and
 * `components/Layout.tsx`, and for every link in `islands/NavMore.tsx`.
 */
export function navCurrent(
  currentPath: string,
  href: string,
): "page" | "true" | "false" {
  const trim = (p: string) => p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p;
  const target = trim(new URL(href, "http://localhost").pathname);
  const current = trim(currentPath);
  if (current === target) return "page";
  // `${target}/` for `/` is `//`, which no path starts with: `/` never
  // becomes a section, unlike under Fresh's matching.
  if (current.startsWith(`${target}/`)) return "true";
  return "false";
}
