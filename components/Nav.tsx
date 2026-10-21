import type { ComponentChildren, ComponentType } from "preact"
import {
  IconBriefcase,
  IconCalendar,
  IconFolder,
  IconGrid,
  IconHome,
  IconInformationCircle,
  IconMail,
  IconPen,
  type IconProps,
  IconServer,
  IconWrench,
} from "@spy4x/preact-icons"
import {
  Rail,
  RailEntry,
  type RailItem,
  type RailPlace,
} from "@spy4x/preact-system/rail"
import {
  BOOK_HREF,
  NAV_BOOK_LABEL,
  NAV_WRITE_LABEL,
  type NavIcon,
  type NavItem,
  railItems,
  sheetBottomItems,
  sheetTopItems,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts"
import { eventAttrs } from "../lib/analytics.ts"

/** The house icon (`@spy4x/preact-icons`) each nav destination draws. */
const NAV_ICONS: Record<NavIcon, ComponentType<IconProps>> = {
  work: IconFolder,
  services: IconGrid,
  how: IconBriefcase,
  tools: IconWrench,
  writing: IconPen,
  home: IconHome,
  about: IconInformationCircle,
  infrastructure: IconServer,
}

interface NavProps {
  currentPath: string
  /** `SCHEDULE_URL`: set → Book; empty → "Write". Both go to `/book`. */
  scheduleUrl: string
  /** The page: lands in the rail's `<main>`. */
  children: ComponentChildren
  /** The site footer: drawn after `<main>`, under the page. */
  footer: ComponentChildren
}

/**
 * The Book action as the rail's primary entry: "Book" to the booking page, or
 * "Write" to its brief when there is no calendar. It carries the markers
 * `data-primary-book` (the accent-fill guard), `data-nav-book` and the
 * analytics event.
 */
function bookItem(scheduleUrl: string): RailItem {
  const write = !scheduleUrl
  return {
    key: "book",
    label: write ? NAV_WRITE_LABEL : NAV_BOOK_LABEL,
    href: write ? WRITE_FALLBACK_HREF : BOOK_HREF,
    Icon: write ? IconMail : IconCalendar,
    attributes: {
      "data-primary-book": "",
      "data-nav-book": "",
      ...eventAttrs(write ? "brief" : "book", { place: "nav" }),
    },
  }
}

function railItem(item: NavItem): RailItem {
  return {
    key: item.href,
    label: item.label,
    href: item.href,
    Icon: NAV_ICONS[item.icon],
    attributes: { "data-nav-link": "" },
  }
}

/**
 * The portrait drawn as the `top` entry's icon: the photo where another
 * entry has its 24px icon. The entry's `aria-label` ("Anton") names the
 * link; the alt text is for the site's rule that no image goes without one.
 */
function Portrait() {
  return (
    <img
      class="size-8 rounded-full border border-rule-strong"
      src="/img/photo-64.webp"
      alt="Photo of Anton Shubin"
      width="32"
      height="32"
    />
  )
}

/** Home, About and Infrastructure: rows of the phone sheet only. */
function sheetItem(item: NavItem): RailItem {
  return { ...railItem(item), sheetOnly: true }
}

/**
 * The site navigation (#185, #433): `@spy4x/preact-system`'s `Rail` in its
 * labels variant: an 88px column of 80px cells with a short label under
 * each icon, and the same current fill as the apps. From 768px: the portrait and "Anton"
 * on top (a `RailEntry` in the `top` slot), linking home, then Book in the
 * accent fill, then `lib/nav.ts`'s `railItems` (the only part that scrolls
 * on a short screen). Below 768px: a tab bar of Work, Services, Book in the
 * centre, Tools and More, whose sheet holds Home and About, the destinations
 * that did not fit, then Infrastructure: the first two and the last are
 * `sheetOnly` items, so More is marked current on their pages. The site
 * footer goes in the `footer` slot, after `<main>`. The profiles and feeds
 * are in the footer (#293).
 *
 * Server-rendered with no island: every entry is a link, More opens its
 * `<dialog>` through the button's `command`/`commandfor` invoker, and a
 * backdrop tap closes it through `closedby="any"`, so nothing here ships
 * JavaScript or competes with the home page's LCP image.
 */
export function Nav({ currentPath, scheduleUrl, children, footer }: NavProps) {
  const top = (place: RailPlace) =>
    place === "rail" && (
      <RailEntry
        item={{ key: "portrait", label: "Anton", href: "/", Icon: Portrait }}
        place="rail"
        variant="labels"
        current={currentPath === "/" ? "page" : undefined}
      />
    )

  return (
    <Rail
      variant="labels"
      items={[
        ...sheetTopItems.map(sheetItem),
        ...railItems.map(railItem),
        ...sheetBottomItems.map(sheetItem),
      ]}
      primary={bookItem(scheduleUrl)}
      currentPath={currentPath}
      // On /book the primary is the page, also as "Write", whose href
      // carries `#brief` and so never equals the path.
      currentKey={currentPath === BOOK_HREF ? "book" : undefined}
      top={top}
      footer={footer}
      labels={{ skipToContent: "Skip to main content" }}
    >
      {children}
    </Rail>
  )
}
