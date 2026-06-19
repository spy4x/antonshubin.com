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
      <main id="main-content" class="p-6 pb-24 sm:ml-16 md:p-12">
        {children}
      </main>
    </>
  );
}
