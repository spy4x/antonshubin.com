import type { ComponentChildren } from "preact";
import Menu from "../islands/Menu.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

interface LayoutProps {
  children: ComponentChildren;
  currentPath: string;
}

export function Layout({ children, currentPath }: LayoutProps) {
  return (
    <>
      <Menu
        {...{ "client:idle": true }}
        currentPath={currentPath}
        scheduleUrl={SCHEDULE_URL}
      />
      <main id="main-content" class="p-4 pb-24 sm:ml-16 md:p-12">
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
