/**
 * The site's navigation destinations (#185): the one place a nav label or
 * href is written. `components/Nav.tsx` renders the desktop rail, the phone
 * tab bar and its "More" sheet, and `components/Footer.tsx` its "Site"
 * group, from these lists, so changing a
 * destination (#188 moves Work to `/work`) is one edit here. Profiles and
 * feeds are not destinations: they live in `lib/profiles.ts` and the footer.
 */

/** The item icons; `components/Nav.tsx` maps each to a `@spy4x/preact-icons` icon. */
export type NavIcon =
  | "work"
  | "services"
  | "how"
  | "tools"
  | "writing"
  | "home"
  | "about"
  | "infrastructure"

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
}

const WORK: NavItem = { href: "/work", label: "Work", icon: "work" }
const SERVICES: NavItem = {
  href: "/catalog",
  label: "Services",
  icon: "services",
}
const HOW_I_WORK: NavItem = {
  href: "/how-i-work",
  label: "How I work",
  icon: "how",
}
const TOOLS: NavItem = { href: "/tools", label: "Tools", icon: "tools" }
const WRITING: NavItem = { href: "/blog", label: "Writing", icon: "writing" }
const HOME: NavItem = { href: "/", label: "Home", icon: "home" }
const ABOUT: NavItem = { href: "/about", label: "About", icon: "about" }
const INFRASTRUCTURE: NavItem = {
  href: "/infrastructure",
  label: "Infrastructure",
  icon: "infrastructure",
}

/**
 * The rail's destinations, top to bottom under the portrait and Book (#433).
 * On a phone the library's `Rail` makes the first three tabs, around Book in
 * the centre, and puts the rest in the "More" sheet; that is why Tools comes
 * before How I work.
 */
export const railItems: NavItem[] = [
  WORK,
  SERVICES,
  TOOLS,
  HOW_I_WORK,
  WRITING,
]

/**
 * The phone "More" sheet's rows around the destinations that did not fit the
 * tab bar: Home and About above them, Infrastructure below. Pages only.
 */
export const sheetTopItems: NavItem[] = [HOME, ABOUT]
export const sheetBottomItems: NavItem[] = [INFRASTRUCTURE]

const allItems: NavItem[] = [
  HOME,
  WORK,
  SERVICES,
  HOW_I_WORK,
  TOOLS,
  WRITING,
  ABOUT,
  INFRASTRUCTURE,
]

/**
 * Where Book goes: the booking page, with the calendar on it (#293). When
 * `SCHEDULE_URL` is unset the button reads "Write" and goes to that page's
 * written brief (`routes/book.tsx`'s `#brief`).
 */
export const BOOK_HREF = "/book"
export const WRITE_FALLBACK_HREF = `${BOOK_HREF}#brief`

/**
 * The one wording of the Book action on every page (#190): every button or
 * link that books the call says this, and only the nav says it shorter
 * (`NAV_BOOK_LABEL`). `test/action-wording.test.ts` fails on a third wording.
 */
export const BOOK_LABEL = "Book a free 30-minute call"

/** The one wording of the written-brief action on every page (#190). */
export const BRIEF_LABEL = "Send a written brief"

/** The nav's short Book, where `BOOK_LABEL` does not fit a tab. */
export const NAV_BOOK_LABEL = "Book"

/** What Book reads, in the nav and the footer, when `SCHEDULE_URL` is unset. */
export const NAV_WRITE_LABEL = "Write"

/**
 * The nav's own word for a section, given the section's path: "Writing" for
 * `/blog`, "Services" for `/catalog`. The back link on a nested page
 * (`components/Breadcrumb.tsx`) uses it, so it never says "Blog" where the
 * nav says "Writing". `undefined` for a path the nav doesn't list.
 */
export function navLabel(href: string): string | undefined {
  return allItems.find((item) => item.href === href)?.label
}

/**
 * The nav item whose section `pathname` is inside (`/blog/x` and `/blog`
 * both give Writing), or `undefined`. Home never matches: every path is
 * under `/`. The 404 page uses it to put the section's button first.
 */
export function navItemFor(pathname: string): NavItem | undefined {
  const trimmed = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname
  return allItems.find((item) =>
    item.href !== "/" &&
    (trimmed === item.href || trimmed.startsWith(`${item.href}/`))
  )
}

/**
 * "Why not just AI?" (#486): listed by the footer only, never the rail or the
 * More sheet. `lib/why-not-just-ai.ts` reads its path and name from here.
 */
export const WHY_NOT_JUST_AI: Pick<NavItem, "href" | "label"> = {
  href: "/why-not-just-ai",
  label: "Why not just AI?",
}

/**
 * The footer's "Site" group: every page the nav lists except Home, then
 * "Why not just AI?" (#486), which the footer alone lists. The footer draws
 * no icons, so an entry is a link only.
 */
export const siteItems: Pick<NavItem, "href" | "label">[] = [
  ...railItems,
  INFRASTRUCTURE,
  ABOUT,
  WHY_NOT_JUST_AI,
]

/**
 * The `aria-current` value for a nav link to `href` on `currentPath`: `"page"`
 * on the page itself, `"true"` anywhere under it, `"false"` otherwise. The
 * same matching Fresh's renderer applies on the server, except that `/` is
 * only ever the page itself: Fresh marks every link to `/` as the current
 * section on every page. Used for the phone header's link to `/` in
 * `components/Layout.tsx`.
 */
export function navCurrent(
  currentPath: string,
  href: string,
): "page" | "true" | "false" {
  const trim = (p: string) => p !== "/" && p.endsWith("/") ? p.slice(0, -1) : p
  const target = trim(new URL(href, "http://localhost").pathname)
  const current = trim(currentPath)
  if (current === target) return "page"
  // `${target}/` for `/` is `//`, which no path starts with: `/` never
  // becomes a section, unlike under Fresh's matching.
  if (current.startsWith(`${target}/`)) return "true"
  return "false"
}
