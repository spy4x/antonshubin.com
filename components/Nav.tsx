import type { ComponentChildren, ComponentType } from "preact";
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
} from "@spy4x/preact-icons";
import {
  Rail,
  railFocusRing,
  type RailItem,
  type RailPlace,
} from "@spy4x/preact-system/rail";
import {
  BOOK_HREF,
  NAV_BOOK_LABEL,
  NAV_WRITE_LABEL,
  navCurrent,
  type NavIcon,
  type NavItem,
  railItems,
  sheetBottomItems,
  sheetTopItems,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";
import { eventAttrs } from "../lib/analytics.ts";

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
};

interface NavProps {
  currentPath: string;
  /** `SCHEDULE_URL`: set → Book; empty → "Write". Both go to `/book`. */
  scheduleUrl: string;
  /** The page: lands in the rail's `<main>`. */
  children: ComponentChildren;
}

/**
 * The Book action as the rail's primary entry: "Book" to the booking page, or
 * "Write" to its brief when there is no calendar. It carries the markers
 * `data-primary-book` (the accent-fill guard), `data-nav-book` and the
 * analytics event.
 */
function bookItem(scheduleUrl: string): RailItem {
  const write = !scheduleUrl;
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
  };
}

function railItem(item: NavItem): RailItem {
  return {
    key: item.href,
    label: item.label,
    href: item.href,
    Icon: NAV_ICONS[item.icon],
    attributes: { "data-nav-link": "" },
  };
}

/**
 * A row in the phone sheet for a page the rail column does not list (Home,
 * About, Infrastructure). Drawn like the library's own sheet rows: 44px
 * high, the icon then the label, the current page filled.
 */
function SheetLinks(
  { items, currentPath }: { items: NavItem[]; currentPath: string },
) {
  return (
    <ul class="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        return (
          <li>
            <a
              href={item.href}
              aria-current={navCurrent(currentPath, item.href)}
              class={`sheet-row ${railFocusRing}`}
            >
              <Icon class="size-6" />
              <span>{item.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The site navigation (#185, #433): `@spy4x/preact-system`'s `Rail` in its
 * labels variant, the same 72px column, cells and current fill as the apps,
 * with a short label under each icon. From 768px: the portrait and "Anton"
 * on top, linking home, then Book in the accent fill, then `lib/nav.ts`'s
 * `railItems` (the only part that scrolls on a short screen). Below 768px: a
 * tab bar of Work, Services, Book in the centre, Tools and More, whose sheet
 * holds Home and About, the destinations that did not fit, then
 * Infrastructure. The profiles and feeds are in the footer (#293).
 *
 * Server-rendered with no island: every entry is a link, and More opens its
 * `<dialog>` through the button's `command`/`commandfor` invoker, so nothing
 * here ships JavaScript or competes with the home page's LCP image.
 */
export function Nav({ currentPath, scheduleUrl, children }: NavProps) {
  const top = (place: RailPlace) =>
    place === "sheet"
      ? <SheetLinks items={sheetTopItems} currentPath={currentPath} />
      : (
        <a
          href="/"
          aria-label="Anton Shubin, home"
          // Explicit "false" off the home page: Fresh's renderer would mark
          // a link to `/` as the current section on every page.
          aria-current={navCurrent(currentPath, "/")}
          class={`rail-home ${railFocusRing}`}
        >
          <img
            class="size-10 rounded-full border border-rule-strong"
            src="/img/photo-64.webp"
            alt="Photo of Anton Shubin"
            width="40"
            height="40"
          />
          <span>Anton</span>
        </a>
      );
  const bottom = (place: RailPlace) =>
    place === "sheet"
      ? <SheetLinks items={sheetBottomItems} currentPath={currentPath} />
      : null;

  return (
    <Rail
      variant="labels"
      items={railItems.map(railItem)}
      primary={bookItem(scheduleUrl)}
      currentPath={currentPath}
      // On /book the primary is the page, also as "Write", whose href
      // carries `#brief` and so never equals the path.
      currentKey={currentPath === BOOK_HREF ? "book" : undefined}
      top={top}
      bottom={bottom}
      labels={{ skipToContent: "Skip to main content" }}
    >
      {children}
    </Rail>
  );
}
