import { useSignal } from "@preact/signals";
import { CloseIcon, MenuIcon } from "../components/Icons.tsx";

interface MobileMenuProps {
  currentPath: string;
  scheduleUrl: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: preact.ComponentChildren;
}

const links: NavLink[] = [
  { href: "/", label: "About me", icon: PersonIcon() },
  { href: "/how-i-work", label: "How I work", icon: BriefcaseIcon() },
  { href: "/catalog", label: "Catalog", icon: GridIcon() },
  { href: "/contact-me", label: "Contact me", icon: MailIcon() },
  { href: "/projects", label: "My projects", icon: FolderIcon() },
  { href: "/blog", label: "Blog", icon: PenIcon() },
];

function PersonIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg
      class="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
      />
    </svg>
  );
}

export default function MobileMenu(
  { currentPath, scheduleUrl }: MobileMenuProps,
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
                      {link.icon}
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
