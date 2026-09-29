import { Head } from "fresh/runtime";
import { Layout } from "./Layout.tsx";
import Button from "./Button.tsx";
import { navItemFor } from "../lib/nav.ts";
import { EMAIL_ADDRESS, emailContact } from "../lib/profiles.ts";

/** The three sections a lost visitor most likely wants, in this order. */
const SECTIONS = ["/work", "/tools", "/blog"];

/**
 * The "page not found" page (#293), for `routes/_404.tsx` and for every
 * `[slug]` route whose slug matches nothing (they answer 404 themselves, so
 * `_404` never sees them). A real title and H1, buttons to the sections
 * people most likely wanted, and an email line. `pathname` is the requested
 * path: a dead link inside a section puts that section's button first.
 */
export function NotFound({ pathname }: { pathname: string }) {
  // A dead link inside a section (`/blog/no-such-post`) most likely wanted
  // that section, so its button comes first, under the nav's own word.
  const section = navItemFor(pathname);
  const buttons = [
    section
      ? { href: section.href, label: `Back to ${section.label}` }
      : { href: "/", label: "Home" },
    ...SECTIONS
      .map((href) => navItemFor(href)!)
      .filter((item) => item.href !== section?.href)
      .map((item) => ({ href: item.href, label: item.label })),
  ];

  return (
    <Layout currentPath="/404">
      <Head>
        <title>Page not found — Anton Shubin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div class="max-w-2xl mx-auto py-16 sm:py-24">
        <h1 class="text-3xl sm:text-4xl text-parchment mb-4 text-balance">
          Page not found
        </h1>
        <p class="text-graphite mb-8 max-w-md">
          The link might be broken, or the page may have been moved. These are
          the places people usually want.
        </p>
        <div class="flex flex-wrap gap-3">
          {buttons.map((b) => (
            <Button key={b.href} href={b.href} class="px-5 py-2.5">
              {b.label}
            </Button>
          ))}
        </div>
        <p class="mt-8 text-sm text-graphite">
          Still lost? Email me at{" "}
          <a
            href={emailContact.href}
            class="text-parchment underline underline-offset-4"
          >
            {EMAIL_ADDRESS}
          </a>.
        </p>
      </div>
    </Layout>
  );
}
