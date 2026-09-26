import { NavGlyph } from "./Icons.tsx";
import { NewTabHint } from "./NewTabHint.tsx";
import { BOOK, FOCUS, navIcon, STACKED, STATES } from "./NavParts.tsx";
import { UPWORK_URL } from "../lib/config.ts";
import NavLinks from "../islands/NavLinks.tsx";
import NavMore from "../islands/NavMore.tsx";
import {
  navCurrent,
  type NavItem,
  railItems,
  tabItemsAfterBook,
  tabItemsBeforeBook,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";

interface NavProps {
  currentPath: string;
  /** `SCHEDULE_URL`: Book's target. Empty → Book reads "Write" and goes to the brief form. */
  scheduleUrl: string;
}

/** The Book action's props: the booking link, or "Write" to the brief form. */
function bookLink(scheduleUrl: string) {
  return scheduleUrl
    ? {
      href: scheduleUrl,
      label: "Book",
      target: "_blank" as const,
      rel: "noopener noreferrer",
      icon: <NavGlyph name="book" />,
    }
    : {
      href: WRITE_FALLBACK_HREF,
      label: "Write",
      target: undefined,
      rel: undefined,
      icon: <NavGlyph name="write" />,
    };
}

/**
 * The site navigation (#185). Desktop (640px up): a fixed left rail read top
 * to bottom — home portrait, Book, the five destinations in `lib/nav.ts`'s
 * `railItems` (the only part that scrolls on a short screen), then a Links
 * popover (`islands/NavLinks.tsx`). Phone: a fixed bottom tab bar — Work,
 * Services, Book in the centre, Tools, More — where More
 * (`islands/NavMore.tsx`) opens a `<dialog>`
 * with the remaining pages and the Links groups.
 *
 * Server-rendered on purpose. Fresh's renderer marks each destination link's
 * `aria-current` from the real request URL, and nothing hydrates here to strip
 * it again. The only exception is `/`, which Fresh would mark as the current
 * section on every page, so home links carry `navCurrent()`'s value instead.
 * As an island this nav also cost the home page's LCP about 160ms under the
 * slow-network profile (scripts/lcp.ts): more JS and HTML competing with the
 * hero image.
 */
export function Nav({ currentPath, scheduleUrl }: NavProps) {
  const book = bookLink(scheduleUrl);

  const tab = (item: NavItem) => (
    <li>
      <a
        href={item.href}
        class={`${STACKED} ${STATES} ${FOCUS} h-14 rounded-xl px-1`}
      >
        {navIcon(item.icon)}
        <span>{item.label}</span>
      </a>
    </li>
  );

  return (
    <nav id="menu" aria-label="Main">
      {/* Phone tab bar */}
      <div
        id="tab-bar"
        class="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-desk border-t border-rule pb-[env(safe-area-inset-bottom)]"
      >
        <ul class="grid grid-cols-5 items-center gap-1 h-16 px-2">
          {tabItemsBeforeBook.map(tab)}
          <li>
            <a
              href={book.href}
              target={book.target}
              rel={book.rel}
              aria-current="false"
              data-primary-book
              data-nav-book
              data-umami-event="nav-book"
              class={`${STACKED} ${BOOK} ${FOCUS} h-14 rounded-full px-1`}
            >
              {book.icon}
              <span>{book.label}</span>
              {book.target && <NewTabHint />}
            </a>
          </li>
          {tabItemsAfterBook.map(tab)}
          <li>
            <NavMore
              {...{ "client:idle": true }}
              currentPath={currentPath}
              upworkUrl={UPWORK_URL}
            />
          </li>
        </ul>
      </div>

      {/* Desktop rail */}
      <div
        id="desktop-menu"
        class="hidden sm:flex fixed inset-y-0 left-0 z-30 w-[calc(4.5rem+env(safe-area-inset-left))] lg:w-[calc(5.5rem+env(safe-area-inset-left))] flex-col gap-2 bg-desk border-r border-rule pl-[calc(0.375rem+env(safe-area-inset-left))] pr-1.5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <a
          href="/"
          aria-label="Anton Shubin, home"
          aria-current={navCurrent(currentPath, "/")}
          class={`${STACKED} ${FOCUS} rounded-xl py-1 text-graphite hover:text-parchment`}
        >
          <img
            class="h-10 w-10 rounded-full border border-rule-strong"
            src="/img/photo-64.webp"
            alt="Photo of Anton Shubin"
            width="40"
            height="40"
          />
          <span>Anton</span>
        </a>
        <a
          href={book.href}
          target={book.target}
          rel={book.rel}
          aria-current="false"
          data-primary-book
          data-nav-book
          data-umami-event="nav-book"
          class={`${STACKED} ${BOOK} ${FOCUS} rounded-xl px-1 py-2.5`}
        >
          {book.icon}
          <span>{book.label}</span>
          {book.target && <NewTabHint />}
        </a>
        <ul class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 p-1 -mx-1">
          {railItems.map((item) => (
            <li>
              <a
                href={item.href}
                data-nav-link
                class={`${STACKED} ${STATES} ${FOCUS} rounded-xl px-1 py-2`}
              >
                {navIcon(item.icon)}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <NavLinks upworkUrl={UPWORK_URL} />
      </div>
    </nav>
  );
}
