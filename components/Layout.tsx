import type { ComponentChildren } from "preact";
import { Nav } from "./Nav.tsx";
import { SCHEDULE_URL, TIMEZONE_LABEL } from "../lib/config.ts";
import { navCurrent } from "../lib/nav.ts";

interface LayoutProps {
  children: ComponentChildren;
  currentPath: string;
}

export function Layout({ children, currentPath }: LayoutProps) {
  return (
    <>
      {
        /* Phone header (#185): scrolls away with the page; the desktop rail
          in components/Nav.tsx carries the portrait from 640px up. */
      }
      <header class="sm:hidden flex items-center gap-2 h-13 px-4 border-b border-rule">
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
        <span class="ml-auto text-sm text-graphite">{TIMEZONE_LABEL}</span>
      </header>
      <Nav currentPath={currentPath} scheduleUrl={SCHEDULE_URL} />
      <main
        id="main-content"
        class="p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:ml-[calc(4.5rem+env(safe-area-inset-left))] sm:pb-4 lg:ml-[calc(5.5rem+env(safe-area-inset-left))] md:p-12 md:pr-[max(3rem,env(safe-area-inset-right))]"
      >
        {children}
        <footer class="max-w-4xl mx-auto mt-16 pt-6 border-t border-rule text-center text-graphite text-sm">
          <p>
            Outside work I ride enduro, ski and scuba dive. Based in Da Nang,
            Vietnam.
          </p>
        </footer>
      </main>
    </>
  );
}
