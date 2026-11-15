import type { ComponentChildren } from "preact"
import { Nav } from "./Nav.tsx"
import { SCHEDULE_URL } from "../lib/config.ts"
import { Footer } from "./Footer.tsx"
import { CONTACT_LABEL, contactHref } from "../lib/nav.ts"
import { eventAttrs } from "../lib/analytics.ts"

interface LayoutProps {
  children: ComponentChildren
  /** The request's path: the rail marks the page, or its section, from it. */
  currentPath: string
}

/**
 * The frame every page shares (#293): the rail around the phone header, the
 * page and the footer. The rail owns `<main>`, so the phone header sits
 * inside it; the footer goes in the rail's `footer` slot, after `<main>`,
 * where it keeps its `contentinfo` landmark.
 */
export function Layout({ children, currentPath }: LayoutProps) {
  return (
    <Nav
      currentPath={currentPath}
      scheduleUrl={SCHEDULE_URL}
      footer={<Footer canBook={Boolean(SCHEDULE_URL)} />}
    >
      {
        /* Phone header (#185): scrolls away with the page; the desktop rail
          carries the portrait from 768px up. On the right a quiet Contact
          link (#529) replaces the role, which repeated the home H1 and
          wrapped onto two lines; the time zone is in the footer as "Da Nang,
          Vietnam (UTC+7)". Neither link is ever current (#561): on a phone
          the tab bar's More is the one mark. Their aria-current is a fixed
          "false" rather than absent, because Fresh's renderer marks a link
          with none itself (every link to `/` as the current section). */
      }
      <header class="md:hidden flex items-center gap-2 h-13 px-4 border-b border-rule">
        <a
          href="/"
          aria-label="Anton Shubin, home"
          aria-current="false"
          class="flex items-center gap-2 rounded-lg text-parchment font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment"
        >
          <img
            class="h-8 w-8 rounded-full border border-rule-strong"
            src="/img/photo-64.webp"
            alt="Photo of Anton Shubin"
            width="32"
            height="32"
          />
          <span>Anton Shubin</span>
        </a>
        <a
          href={contactHref(SCHEDULE_URL)}
          aria-current="false"
          data-header-contact
          {...eventAttrs(SCHEDULE_URL ? "book" : "brief", { place: "nav" })}
          class="ml-auto -mr-2 flex items-center min-h-11 px-2 rounded-lg text-sm text-graphite underline decoration-rule-strong underline-offset-4 hover:text-parchment hover:decoration-parchment focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment"
        >
          {CONTACT_LABEL}
        </a>
      </header>
      <div
        id="main-content"
        class="p-4 md:p-12 md:pr-[max(3rem,env(safe-area-inset-right))]"
      >
        {children}
      </div>
    </Nav>
  )
}
