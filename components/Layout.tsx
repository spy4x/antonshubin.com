import type { ComponentChildren } from "preact";
import MobileMenu from "../islands/MobileMenu.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

interface LayoutProps {
  children: ComponentChildren;
  currentPath: string;
}

export function Layout({ children, currentPath }: LayoutProps) {
  return (
    <>
      <MobileMenu currentPath={currentPath} scheduleUrl={SCHEDULE_URL} />
      <main class="p-6 pb-24 sm:ml-16 md:p-12">{children}</main>
    </>
  );
}
