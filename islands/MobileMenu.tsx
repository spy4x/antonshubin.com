import { useSignal } from "@preact/signals";
import {
  UpworkIcon,
  YouTubeIcon,
  GitHubIcon,
  TwitterIcon,
  EmailIcon,
  MenuIcon,
  CloseIcon,
} from "../components/Icons.tsx";

interface MobileMenuProps {
  currentPath: string;
}

export default function MobileMenu({ currentPath }: MobileMenuProps) {
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
            class="text-center border-t border-gray-700 sm:hidden"
          >
            <div class="px-2 pt-2 space-y-1">
              <a href="/" class={linkClass("/")}>
                About me
              </a>
              <a href="/projects" class={linkClass("/projects")}>
                My Projects
              </a>
              <a href="/blog" class={linkClass("/blog")}>
                Blog
              </a>
              <div class="flex justify-center items-center gap-3 py-2">
                <a
                  class="text-gray-300 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white"
                  href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
                  target="_blank"
                >
                  <UpworkIcon />
                </a>
                <a
                  class="text-gray-300 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white"
                  href="https://www.youtube.com/@anton-shubin"
                  target="_blank"
                >
                  <YouTubeIcon />
                </a>
                <a
                  class="text-gray-300 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white"
                  href="https://github.com/spy4x"
                  target="_blank"
                >
                  <GitHubIcon />
                </a>
                <a
                  class="text-gray-300 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white"
                  href="https://twitter.com/spy4x"
                  target="_blank"
                >
                  <TwitterIcon />
                </a>
                <a
                  class="text-gray-300 px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white contact-link"
                  href="mailto:2spy4x+ws@gmail.com"
                >
                  <EmailIcon />
                </a>
              </div>
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

            {/* Logo and mobile label */}
            <div
              class="flex-1 flex flex-row-reverse items-center justify-center sm:items-stretch sm:justify-start"
            >
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
                <div class="flex flex-row-reverse items-center gap-3">
                  <a
                    class={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive("/")
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    href="/"
                  >
                    About me
                  </a>
                  <a
                    class={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive("/projects")
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    href="/projects"
                  >
                    Projects
                  </a>
                  <a
                    class={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive("/blog")
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    href="/blog"
                  >
                    Blog
                  </a>
                  <a
                    class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white"
                    href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
                    target="_blank"
                  >
                    <UpworkIcon />
                  </a>
                  <a
                    class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium rotate-90 hover:bg-gray-700 hover:text-white"
                    href="https://www.youtube.com/@anton-shubin"
                    target="_blank"
                  >
                    <YouTubeIcon />
                  </a>
                  <a
                    class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium rotate-90 hover:bg-gray-700 hover:text-white"
                    href="https://github.com/spy4x"
                    target="_blank"
                  >
                    <GitHubIcon />
                  </a>
                  <a
                    class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium rotate-90 hover:bg-gray-700 hover:text-white"
                    href="https://twitter.com/spy4x"
                    target="_blank"
                  >
                    <TwitterIcon />
                  </a>
                  <a
                    class="text-gray-300 px-3 py-2 rounded-md text-sm font-medium rotate-90 hover:bg-gray-700 hover:text-white contact-link"
                    href="mailto:2spy4x+ws@gmail.com"
                  >
                    <EmailIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
