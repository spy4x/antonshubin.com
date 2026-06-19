import { useSignal } from "@preact/signals";
import {
  BriefcaseIcon,
  CloseIcon,
  FolderIcon,
  GridIcon,
  MailIcon,
  MenuIcon,
  PenIcon,
  PersonIcon,
  ServerIcon,
} from "../components/Icons.tsx";

interface MenuProps {
  currentPath: string;
  scheduleUrl: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: preact.ComponentChildren;
}

const links: NavLink[] = [
  { href: "/", label: "About me", icon: <PersonIcon class="w-5 h-5" /> },
  {
    href: "/how-i-work",
    label: "How I work",
    icon: <BriefcaseIcon class="w-5 h-5" />,
  },
  { href: "/catalog", label: "Catalog", icon: <GridIcon class="w-5 h-5" /> },
  {
    href: "/contact-me",
    label: "Contact me",
    icon: <MailIcon class="w-5 h-5" />,
  },
  {
    href: "/projects",
    label: "Completed Projects",
    icon: <FolderIcon class="w-5 h-5" />,
  },
  {
    href: "/infrastructure",
    label: "Infrastructure",
    icon: <ServerIcon class="w-5 h-5" />,
  },
  { href: "/blog", label: "Blog", icon: <PenIcon class="w-5 h-5" /> },
];

export default function Menu(
  { currentPath, scheduleUrl: _scheduleUrl }: MenuProps,
) {
  const isOpen = useSignal(false);

  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
  };

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  const linkClass = (href: string) =>
    `block px-3 py-2 rounded-md text-base font-medium ${
      isActive(href)
        ? "bg-orange-500 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  const desktopLinkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium ${
      isActive(href)
        ? "bg-orange-500 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <>
      {/* Mobile menu shadow/backdrop */}
      {isOpen.value && (
        <div
          id="mobile-menu-shadow"
          class="fixed inset-0 z-20"
          style="backdrop-filter: blur(5px); background-color: rgba(0, 0, 0, 0.3);"
          onClick={toggleMenu}
        />
      )}

      <nav
        id="menu"
        class="bg-gray-800 fixed inset-x-0 bottom-0 z-30 whitespace-nowrap sm:fixed sm:origin-top-left sm:-rotate-90 sm:translate-y-full sm:border-b sm:border-gray-700"
      >
        {/* Mobile menu content */}
        {isOpen.value && (
          <div
            id="mobile-menu"
            class="border-t border-gray-700 sm:hidden"
          >
            <div class="px-4 py-3 space-y-1">
              {links.map((link) => (
                <a
                  href={link.href}
                  class={linkClass(link.href)}
                >
                  <span class="inline-flex items-center gap-3">
                    <span class="shrink-0">{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div class="max-w-7xl mx-auto px-2 border-t border-gray-700 sm:px-6 lg:px-8">
          <div class="relative flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div class="absolute inset-y-0 right-0 flex items-center sm:hidden">
              <button
                type="button"
                class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleMenu}
              >
                <span class="sr-only">Open main menu</span>
                {isOpen.value ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>

            {/* Logo and menu */}
            <div class="flex-1 flex flex-row-reverse items-center justify-center sm:items-stretch sm:justify-start">
              <div class="flex-shrink-0 flex items-center sm:pl-6">
                <div class="absolute inset-y-0 left-0 flex items-center sm:relative">
                  <a href="/" class="flex items-center">
                    <img
                      class="h-10 w-10 rounded-full border border-gray-100 sm:rotate-90"
                      src="/img/photo-64.webp"
                      alt="Photo of Anton Shubin"
                      width="40"
                      height="40"
                    />
                  </a>
                </div>
                <button
                  type="button"
                  class="text-white text-xl ml-3 justify-self-center sm:hidden"
                  onClick={toggleMenu}
                >
                  Menu
                </button>
              </div>

              {/* Desktop menu */}
              <div
                id="desktop-menu"
                class="hidden sm:flex sm:ml-6 justify-center"
              >
                <div class="flex items-center gap-1">
                  {[...links].reverse().map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      class={desktopLinkClass(link.href)}
                    >
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
