import type { ComponentChildren } from "preact"
import { Nav } from "./Nav.tsx"
import { SCHEDULE_URL } from "../lib/config.ts"
import { ROLE } from "../lib/head.ts"
import { Footer } from "./Footer.tsx"
import { navCurrent } from "../lib/nav.ts"

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
          carries the portrait from 768px up. The role replaces the bare UTC
          offset (#293); the time zone is in the footer as "Da Nang, Vietnam
          (UTC+7)". */
      }
      <header class="md:hidden flex items-center gap-2 h-13 px-4 border-b border-rule">
        <a
          href="/"
          aria-label="Anton Shubin, home"
          aria-current={navCurrent(currentPath, "/")}
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
        <span class="ml-auto max-w-[11rem] text-right text-xs leading-tight text-graphite">
          {ROLE}
        </span>
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
