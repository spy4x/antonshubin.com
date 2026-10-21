import type { ComponentChildren, ComponentType } from "preact"
import {
  IconBriefcase,
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
  CONTACT_LABEL,
  contactHref,
  type NavIcon,
  type NavItem,
  railItems,
  sheetBottomItems,
  sheetTopItems,
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
  /** `SCHEDULE_URL`: set → Contact goes to `/book`; empty → to its brief. */
  scheduleUrl: string
  /** The page: lands in the rail's `<main>`. */
  children: ComponentChildren
  /** The site footer: drawn after `<main>`, under the page. */
  footer: ComponentChildren
}

/**
 * Contact (#529): the booking page as an ordinary destination, drawn like
 * every other entry and never in the accent fill. It carries `data-nav-contact`
 * and the analytics event (`book`, or `brief` without a calendar, with
 * `place: nav`), never `data-primary-book`: the navigation holds no call to
 * action.
 */
function contactItem(scheduleUrl: string): RailItem {
  return {
    key: "contact",
    label: CONTACT_LABEL,
    href: contactHref(scheduleUrl),
    Icon: IconMail,
    attributes: {
      "data-nav-contact": "",
      ...eventAttrs(scheduleUrl ? "book" : "brief", { place: "nav" }),
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
 * The site navigation (#185, #433, #529): `@spy4x/preact-system`'s `Rail` in
 * its labels variant: an 88px column of 80px cells with a short label under
 * each icon, and the same current fill as the apps. From 768px: the portrait
 * and "Anton" on top (a `RailEntry` in the `top` slot), linking home, then
 * `lib/nav.ts`'s `railItems` (the only part that scrolls on a short screen),
 * then Contact in the `bottom` slot. Below 768px: a tab bar of Work,
 * Services, Tools, Writing and More, whose sheet holds Home and About, How I
 * work, then Infrastructure and Contact: all but How I work are `sheetOnly`
 * items, so More is marked current on their pages. The site footer goes in
 * the `footer` slot, after `<main>`. The profiles and feeds are in the footer
 * (#293). No entry is a call to action: Book buttons live in the page body.
 *
 * Server-rendered with no island: every entry is a link, More opens its
 * `<dialog>` through the button's `command`/`commandfor` invoker, and a
 * backdrop tap closes it through `closedby="any"`, so nothing here ships
 * JavaScript or competes with the home page's LCP image.
 */
export function Nav({ currentPath, scheduleUrl, children, footer }: NavProps) {
  const contact = contactItem(scheduleUrl)
  // Contact's href carries `#brief` without a calendar, so it never equals
  // the path: on /book it is current by its key.
  const onBook = currentPath === BOOK_HREF
  const top = (place: RailPlace) =>
    place === "rail" && (
      <RailEntry
        item={{ key: "portrait", label: "Anton", href: "/", Icon: Portrait }}
        place="rail"
        variant="labels"
        current={currentPath === "/" ? "page" : undefined}
      />
    )
  // The column's Contact. The sheet's Contact is a `sheetOnly` item instead,
  // so the More tab is marked current on /book like on Home or About.
  const bottom = (place: RailPlace) =>
    place === "rail" && (
      <RailEntry
        item={contact}
        place="rail"
        variant="labels"
        current={onBook ? "page" : undefined}
      />
    )

  return (
    <Rail
      variant="labels"
      items={[
        ...sheetTopItems.map(sheetItem),
        ...railItems.map(railItem),
        ...sheetBottomItems.map(sheetItem),
        { ...contact, sheetOnly: true },
      ]}
      currentPath={currentPath}
      currentKey={onBook ? contact.key : undefined}
      top={top}
      bottom={bottom}
      footer={footer}
      labels={{ skipToContent: "Skip to main content" }}
    >
      {children}
    </Rail>
  )
}
