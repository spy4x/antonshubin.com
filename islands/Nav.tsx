import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";
import type { ComponentChildren } from "preact";
import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CloseIcon,
  FolderIcon,
  GridIcon,
  LinkIcon,
  MailIcon,
  MenuIcon,
  PenIcon,
  PersonIcon,
  WrenchIcon,
} from "../components/Icons.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import {
  linkGroups,
  moreItems,
  navCurrent,
  type NavIcon,
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

const ICON_CLASS = "w-5 h-5 shrink-0";

function icon(name: NavIcon): ComponentChildren {
  switch (name) {
    case "work":
      return <FolderIcon class={ICON_CLASS} />;
    case "services":
      return <GridIcon class={ICON_CLASS} />;
    case "how":
      return <BriefcaseIcon class={ICON_CLASS} />;
    case "tools":
      return <WrenchIcon class={ICON_CLASS} />;
    case "writing":
      return <PenIcon class={ICON_CLASS} />;
    case "home":
      return <PersonIcon class={ICON_CLASS} />;
    case "infrastructure":
      return <BuildingIcon class={ICON_CLASS} />;
  }
}

/**
 * Focus: a 2px Parchment ring with a 2px gap, never the accent (#185 states).
 */
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment";

/**
 * Item states, all read from the link's `aria-current`: the page itself → Lamp pill with a
 * Parchment 600 label; a parent section (`aria-current="true"`) → outlined
 * pill; otherwise Graphite, Paper on hover.
 */
const STATES =
  "border border-transparent text-graphite hover:text-parchment [&:not([aria-current=page]):hover]:bg-paper aria-[current=page]:bg-lamp aria-[current=page]:text-parchment aria-[current=page]:font-semibold aria-[current=true]:border-rule-strong aria-[current=true]:text-parchment";

/** A rail or tab-bar item: icon above an upright label. */
const STACKED =
  "flex flex-col items-center justify-center gap-1 text-xs leading-tight text-center";

const BOOK =
  "bg-accent text-ink font-semibold hover:bg-accent-hover border border-transparent";

/** The Book action's props: the booking link, or "Write" to the brief form. */
function bookLink(scheduleUrl: string) {
  return scheduleUrl
    ? {
      href: scheduleUrl,
      label: "Book",
      target: "_blank" as const,
      rel: "noopener noreferrer",
      icon: <CalendarIcon class={ICON_CLASS} />,
    }
    : {
      href: WRITE_FALLBACK_HREF,
      label: "Write",
      target: undefined,
      rel: undefined,
      icon: <MailIcon class={ICON_CLASS} />,
    };
}

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

/** The Links groups, shared by the desktop popover and the phone sheet. */
function LinkGroups({ idPrefix }: { idPrefix: string }) {
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

/**
 * The site navigation (#185). Desktop (640px up): a fixed left rail read top
 * to bottom — home portrait, Book, the five destinations in `lib/nav.ts`'s
 * `railItems` (the only part that scrolls on a short screen), then a Links
 * popover. Phone: a fixed bottom tab bar — Work, Services, Book in the
 * centre, Tools, More — where More opens a `<dialog>` with the remaining
 * pages and the Links groups. The phone header lives in
 * `components/Layout.tsx`: it has no behaviour, so it ships no JS.
 */
export default function Nav({ currentPath, scheduleUrl }: NavProps) {
  const isMoreOpen = useSignal(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const book = bookLink(scheduleUrl);
  // Which link is current. On the server Fresh's renderer marks every link
  // from the real request URL (`currentPath` is only the section on some
  // pages, e.g. "/catalog" on a catalog item), so a link's `aria-current` is
  // left to it there — except `/`, which Fresh would mark on every page.
  // Hydration then drops every attribute this island's own vnode lacks, so
  // in the browser the island sets the value itself, from the real URL.
  const livePath = typeof location === "undefined"
    ? undefined
    : location.pathname;
  const current = (href: string) =>
    href === "/"
      ? navCurrent(livePath ?? currentPath, "/")
      : livePath === undefined
      ? undefined
      : navCurrent(livePath, href);
  const moreHoldsCurrent = moreItems.some((item) =>
    item.href !== "/" &&
    navCurrent(livePath ?? currentPath, item.href) !== "false"
  );

  const openMore = () => {
    dialogRef.current?.showModal();
    isMoreOpen.value = true;
  };

  const closeMore = () => dialogRef.current?.close();

  // Runs however the dialog closed — Escape, the Close button or a tap on
  // the backdrop — so focus always lands back on More.
  const onDialogClose = () => {
    isMoreOpen.value = false;
    moreButtonRef.current?.focus();
  };

  const tab = (item: NavItem) => (
    <li key={item.href}>
      <a
        href={item.href}
        aria-current={current(item.href)}
        class={`${STACKED} ${STATES} ${FOCUS} h-14 rounded-xl px-1`}
      >
        {icon(item.icon)}
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
            <button
              ref={moreButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen.value}
              aria-controls="mobile-menu"
              data-section-current={moreHoldsCurrent || undefined}
              class={`${STACKED} ${STATES} ${FOCUS} w-full h-14 rounded-xl px-1 data-[section-current]:border-rule-strong data-[section-current]:text-parchment`}
              onClick={openMore}
            >
              <MenuIcon class={ICON_CLASS} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Phone "More" sheet */}
      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-labelledby="mobile-menu-title"
        class="m-0 mt-auto w-full max-w-full max-h-[85dvh] rounded-t-2xl border-t border-rule bg-lamp p-0 text-parchment backdrop:bg-ink/70"
        onClose={onDialogClose}
        onClick={(e) => {
          // A click whose target is the <dialog> itself landed on the
          // backdrop: the inner panel covers the whole dialog box.
          if (e.target === dialogRef.current) closeMore();
        }}
      >
        <div class="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div class="flex items-center justify-between pb-2">
            <h2 id="mobile-menu-title" class="px-3 text-lg">More</h2>
            <button
              type="button"
              aria-label="Close"
              class={`rounded-lg p-2 text-graphite hover:bg-paper hover:text-parchment ${FOCUS}`}
              onClick={closeMore}
            >
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>
          <ul class="space-y-1 pb-4 mb-3 border-b border-rule">
            {moreItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={current(item.href)}
                  class={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${STATES} ${FOCUS}`}
                >
                  {icon(item.icon)}
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <LinkGroups idPrefix="more-links" />
        </div>
      </dialog>

      {/* Desktop rail */}
      <div
        id="desktop-menu"
        class="hidden sm:flex fixed inset-y-0 left-0 z-30 w-18 lg:w-22 flex-col gap-2 bg-desk border-r border-rule px-1.5 py-3"
      >
        <a
          href="/"
          aria-label="Anton Shubin, home"
          aria-current={current("/")}
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
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={current(item.href)}
                data-nav-link
                class={`${STACKED} ${STATES} ${FOCUS} rounded-xl px-1 py-2`}
              >
                {icon(item.icon)}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          popovertarget="nav-links"
          class={`${STACKED} ${STATES} ${FOCUS} rounded-xl px-1 py-2`}
        >
          <LinkIcon class={ICON_CLASS} />
          <span>Links</span>
        </button>
        <div
          id="nav-links"
          popover
          class="m-0 top-auto right-auto bottom-3 left-20 lg:left-24 w-64 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border border-rule bg-lamp p-2 text-parchment shadow-lg"
        >
          <LinkGroups idPrefix="rail-links" />
        </div>
      </div>
    </nav>
  );
}
