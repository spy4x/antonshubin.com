import { IconArrowUpRight } from "@spy4x/preact-icons";
import { NewTabHint } from "../../NewTabHint.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import { DEMO_ADMIN, DEMO_APP, DEMO_NOTE } from "./demo.ts";

/** One live surface of Seed: a host, what it is, and its shot. */
interface Surface {
  id: string;
  href: string;
  /** The `outbound` event's `to`. */
  to: string;
  title: string;
  /** Left out until the owner approves one (the website's). */
  line?: string;
  linkLabel: string;
  /** The shot's file stem under `/img/tools/seed/`, at 360 and 720px wide. */
  shot: string;
  alt: string;
}

const SURFACES: Surface[] = [
  {
    id: "app",
    href: DEMO_APP,
    to: "demo-app",
    title: "The app",
    line: "The SPA, which works offline.",
    linkLabel: "Open the app",
    shot: "running-app",
    alt:
      "Seed's demo app in the dark theme: the Notes page of the group Product team, with tag filters and notes such as Release notes for 2.4.",
  },
  {
    id: "admin",
    href: DEMO_ADMIN,
    to: "demo-admin",
    title: "The admin panel",
    line: "It runs on a host of its own.",
    linkLabel: "Open the admin panel",
    shot: "running-admin",
    alt:
      "Seed's demo admin panel: the Users page with a search box, status and role filters, and a table of people with their role and status.",
  },
  {
    id: "site",
    href: "https://seedsaas.com",
    to: "website",
    title: "The public website",
    linkLabel: "Open seedsaas.com",
    shot: "running-site",
    alt:
      "The seedsaas.com home page: the headline The groundwork of your SaaS, already built, with Try the live demo and View on GitHub buttons.",
  },
];

/** A card's shot `sizes`: a third from 1024px, a half from 640px. */
const SIZES = "(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw";

/**
 * "See it running" (#455): Seed's three live surfaces, each one card that
 * is one link to the real thing in a new tab (`outbound`, `place: body`),
 * then the demo note. Three columns from 1024px, two from 640px. The shot
 * sits inside the link, so the lightbox leaves it alone; the link is
 * named by its "Open …" line and described by the card's title and line.
 */
export function SeedRunning() {
  return (
    <section aria-labelledby="running" data-seed-running>
      <h2 id="running" class="text-2xl sm:text-3xl text-parchment">
        See it running
      </h2>
      <ul class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SURFACES.map((s) => {
          const host = new URL(s.href).host;
          return (
            <li key={s.id} class="min-w-0">
              <a
                href={s.href}
                target="_blank"
                rel="noopener"
                aria-labelledby={`running-${s.id}-open`}
                aria-describedby={`running-${s.id}-title${
                  s.line ? ` running-${s.id}-line` : ""
                }`}
                data-seed-surface={s.to}
                {...eventAttrs("outbound", {
                  to: s.to,
                  item: "seed",
                  place: "body",
                })}
                class="group flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper hover:border-rule-strong"
              >
                <img
                  src={`/img/tools/seed/${s.shot}-720.webp`}
                  srcset={`/img/tools/seed/${s.shot}-360.webp 360w, /img/tools/seed/${s.shot}-720.webp 720w`}
                  sizes={SIZES}
                  alt={s.alt}
                  width={720}
                  height={450}
                  loading="lazy"
                  decoding="async"
                  class="block aspect-[16/10] w-full border-b border-rule object-cover object-top"
                />
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                  <span class="block truncate text-sm text-graphite">
                    {host}
                  </span>
                  <h3
                    id={`running-${s.id}-title`}
                    class="mt-1 text-lg text-parchment"
                  >
                    {s.title}
                  </h3>
                  {s.line && (
                    <p id={`running-${s.id}-line`} class="mt-1 text-graphite">
                      {s.line}
                    </p>
                  )}
                  <span
                    id={`running-${s.id}-open`}
                    class="mt-auto inline-flex items-center gap-1 pt-4 text-sm text-parchment underline decoration-rule-strong underline-offset-4 group-hover:decoration-parchment"
                  >
                    {s.linkLabel}
                    <IconArrowUpRight class="size-4 shrink-0" />
                    <NewTabHint />
                  </span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <p data-seed-demo-note class="mt-4 max-w-3xl text-sm text-graphite">
        {DEMO_NOTE}
      </p>
    </section>
  );
}
