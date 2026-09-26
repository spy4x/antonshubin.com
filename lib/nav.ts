/**
 * The site's navigation destinations (#185): the one place a nav label, href
 * or Links entry is written. `components/Nav.tsx` renders the desktop rail and
 * the phone tab bar, `islands/NavMore.tsx` the phone "More" sheet and
 * `islands/NavLinks.tsx` the Links popover, from these lists, so changing a
 * destination (#188 moves Work to `/work`) is one edit here.
 */

/** The item icons; each names a glyph in `components/Icons.tsx`'s `NavGlyph`. */
export type NavIcon =
  | "work"
  | "services"
  | "how"
  | "tools"
  | "writing"
  | "home"
  | "infrastructure";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

export interface NavLinkGroup {
  label: string;
  links: { href: string; label: string }[];
}

const WORK: NavItem = { href: "/projects", label: "Work", icon: "work" };
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

/** What the phone "More" sheet lists above the Links groups. */
export const moreItems: NavItem[] = [
  HOME,
  HOW_I_WORK,
  WRITING,
  INFRASTRUCTURE,
];

/**
 * Where Book goes when `SCHEDULE_URL` is unset: the written-brief lead form
 * on the home page (`routes/index.tsx`'s `#audit-form`), labelled "Write".
 */
export const WRITE_FALLBACK_HREF = "/#audit-form";

/** The Links popover (desktop) and the Links part of the More sheet (phone). */
export const linkGroups: NavLinkGroup[] = [
  {
    label: "Running",
    links: [
      { href: "https://meet.antonshubin.com", label: "meet.antonshubin.com" },
      { href: "https://dash.antonshubin.com", label: "dash.antonshubin.com" },
      {
        href: "https://probe-home.antonshubin.com",
        label: "probe-home.antonshubin.com",
      },
    ],
  },
  {
    label: "Profiles",
    links: [
      { href: "https://github.com/spy4x", label: "GitHub" },
      { href: "https://www.linkedin.com/in/anton-shubin", label: "LinkedIn" },
      { href: "https://www.youtube.com/@anton-shubin", label: "YouTube" },
      { href: "https://www.upwork.com/freelancers/ashubin", label: "Upwork" },
    ],
  },
  {
    label: "Feeds",
    links: [
      { href: "/rss.xml", label: "RSS" },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
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
