import { INVOICE_NOTE, LOCATION, TIMEZONE_LABEL } from "../lib/config.ts";
import { siteItems } from "../lib/nav.ts";
import {
  emailContact,
  footerProfiles,
  type Profile,
  telegramContact,
} from "../lib/profiles.ts";
import { ROLE } from "../lib/head.ts";
import { NewTabHint } from "./NewTabHint.tsx";

interface FooterLink {
  href: string;
  label: string;
}

interface FooterGroup {
  id: string;
  label: string;
  links: FooterLink[];
}

const fromProfile = ({ href, label }: Profile): FooterLink => ({ href, label });

/**
 * The site's footer (#293): identity, then four labelled link groups. Every
 * link the rail's old Links popover held is here, or on the page it belongs
 * to. Plain server markup with no island, and text only: it is on every page,
 * so its bytes compete with the home page's LCP image (see `components/Nav.tsx`).
 * `canBook` is whether `SCHEDULE_URL` is set: the Contact group's first link
 * reads "Book a call" when it is and "Write" when it isn't, like the nav's
 * Book, and goes to `/book` either way.
 */
export function Footer({ canBook }: { canBook: boolean }) {
  const groups: FooterGroup[] = [
    {
      id: "site",
      label: "Site",
      links: [
        ...siteItems.map(({ href, label }) => ({ href, label })),
        { href: "/privacy", label: "Privacy" },
      ],
    },
    {
      id: "contact",
      label: "Contact",
      links: [
        { href: "/book", label: canBook ? "Book a call" : "Write" },
        fromProfile(emailContact),
        fromProfile(telegramContact),
      ],
    },
    {
      id: "elsewhere",
      label: "Elsewhere",
      links: footerProfiles.map(fromProfile),
    },
    {
      id: "machines",
      label: "For machines",
      links: [
        { href: "/rss.xml", label: "RSS" },
        { href: "/llms.txt", label: "llms.txt" },
        { href: "/llms-full.txt", label: "llms-full.txt" },
        { href: "/sitemap.xml", label: "sitemap.xml" },
      ],
    },
  ];

  return (
    <footer class="site-footer bg-desk border-t border-rule px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] text-sm text-graphite sm:ml-[calc(4.5rem+env(safe-area-inset-left))] sm:pb-8 lg:ml-[calc(5.5rem+env(safe-area-inset-left))] md:px-12 md:pr-[max(3rem,env(safe-area-inset-right))]">
      <div class="grid grid-cols-2 gap-x-4 gap-y-8 lg:gap-x-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
        <div class="col-span-2 space-y-1 lg:col-span-1">
          <p class="text-parchment font-semibold">Anton Shubin</p>
          <p>{ROLE}</p>
          <p>{LOCATION} ({TIMEZONE_LABEL})</p>
          <p class="pt-2">
            {INVOICE_NOTE}
          </p>
        </div>
        {groups.map((g) => (
          <div>
            <p id={`footer-${g.id}`} class="pb-1">{g.label}</p>
            <ul aria-labelledby={`footer-${g.id}`}>
              {g.links.map((l) => {
                const external = l.href.startsWith("http");
                return (
                  <li>
                    <a
                      href={l.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                    >
                      {l.label}
                      {external && <NewTabHint />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p class="mt-8">© {new Date().getFullYear()} Anton Shubin</p>
    </footer>
  );
}
