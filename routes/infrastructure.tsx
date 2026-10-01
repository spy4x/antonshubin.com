import { cn } from "@spy4x/preact-cn";
import {
  BOOK_HREF,
  BOOK_LABEL,
  BRIEF_LABEL,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { Layout } from "../components/Layout.tsx";
import { SEOHead } from "../components/SEOHead.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import Button, { buttonClass } from "../components/Button.tsx";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { Fact, FactCard } from "../components/FactCard.tsx";
import { InfraMap } from "../components/InfraMap.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { WithNote } from "../components/WithNote.tsx";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import { projects } from "../lib/data.ts";
import { getBreadcrumb, head } from "../lib/head.ts";
import {
  infraLayers,
  type LayerCheck,
  liveLinks,
  MAP_CAPTION,
  mentionedToolIds,
} from "../lib/infrastructure.ts";
import { toJsonLd } from "../lib/json-ld.ts";
import { projectLead } from "../lib/llms.ts";
import { define } from "../lib/utils.ts";
import { eventAttrs } from "../lib/analytics.ts";

const BASE = "https://antonshubin.com";
const REPO = "https://github.com/spy4x/antonshubin.com";
const BUILD_ID = Deno.env.get("BUILD_ID") || "dev";

const LINK =
  "text-parchment underline underline-offset-4 hover:text-accent focus-visible:text-accent";

/** The founder sentence the page has always led with: the buyer's questions, not tool names. */
const LEAD =
  "Founders should not need to manage infrastructure. They should know how product risk is controlled, what happens when something fails, and whether another team can take over cleanly.";

/** The three rows of "your cloud is fine too"; `example` adds the SmartLite case under it. */
const workload = [
  {
    title: "Self-hosted",
    text:
      "Open-source and self-hostable by default, for cost discipline, performance, portability, and auditability. Dedicated hardware when the workload justifies it: single-tenant CPU, NVMe, predictable cost.",
    example: false,
  },
  {
    title: "Managed cloud",
    text:
      "AWS, GCP, Supabase, and friends when they remove meaningful operational risk, satisfy compliance needs, or let a small team move faster.",
    example: true,
  },
  {
    title: "Hybrid",
    text:
      "Managed services where they remove risk, stable workloads on dedicated hardware where control and capacity matter more.",
    example: false,
  },
];

/** One "where to check" entry: a link, or the sentence saying why there is none. */
function Check({ c }: { c: LayerCheck }) {
  if (typeof c === "string") return <>{c}</>;
  return (
    <a
      href={c.href}
      {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      class={LINK}
    >
      {c.label}
      {c.external && <NewTabHint />}
    </a>
  );
}

/** The `TechArticle` node: the page as a write-up, mentioning each tool page's node. */
function articleJsonLd(canonical: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${canonical}#article`,
    "headline": "How I run production",
    "description": head.value.description,
    "url": canonical,
    "author": { "@id": `${BASE}/#person` },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
    "mentions": mentionedToolIds().map((id) => ({ "@id": id })),
  };
}

export default define.page(function Infrastructure() {
  const canonical = `${BASE}/infrastructure`;
  head.value = {
    ...head.value,
    title:
      "How I run production: Docker Compose, Traefik and self-hosted CI — Anton Shubin",
    pageName: "Infrastructure",
    description:
      "How Anton runs his own production: Docker Compose behind Traefik, Authelia sign-in, restic backups, Gatus checks and self-hosted CI, with the live services linked.",
    canonical,
    ogType: "article",
    ogImage: `${BASE}/img/og/infrastructure.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  const smartlite = projects.freelance.find((p) => p.slug === "smartlite")!;
  const mvp = catalogItem("zero-to-production-saas-mvp");
  const ongoing = catalogItem("cto-advisory-retainer");
  const commit = /^[0-9a-f]{7,40}$/.test(BUILD_ID) ? BUILD_ID : "";

  return (
    <Layout currentPath="/infrastructure">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd(canonical)) }}
      />
      <div class="max-w-6xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb items={getBreadcrumb(canonical, "Infrastructure")} />

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <div class="lg:col-start-1 lg:row-start-1 min-w-0">
            <header data-infra-hero>
              <h1 class="text-3xl sm:text-5xl text-parchment text-balance">
                How I run production
              </h1>
              <p class="mt-4 text-graphite text-base sm:text-xl leading-relaxed">
                {LEAD}
              </p>
            </header>

            <section
              aria-labelledby="see-running"
              data-infra-live
              class="mt-8"
            >
              <h2 id="see-running" class="text-lg text-parchment">
                See it running
              </h2>
              <WithNote id="infra-live-checked" class="note-stack">
                <ul class="mt-3 flex flex-col gap-4">
                  {liveLinks.map((l) => (
                    <li key={l.id}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-live-link={l.id}
                        {...eventAttrs("outbound", { to: l.id })}
                        class={buttonClass(
                          "secondary",
                          "w-full sm:w-auto justify-between gap-3 px-4 py-2.5 text-sm break-all",
                        )}
                      >
                        <span>{l.label}</span>
                        <ArrowRightIcon class="w-3.5 h-3.5 shrink-0" />
                        <NewTabHint />
                      </a>
                      <span class="block mt-1 text-xs text-graphite">
                        <StatusMark status="live" /> {l.shows}
                      </span>
                    </li>
                  ))}
                </ul>
              </WithNote>
              <p class="mt-4 text-sm text-graphite">
                A red tile on the status page means something is down now, and
                you see it when I do.
              </p>
            </section>
          </div>

          {/* "This site": after the live links at 390px, the right column from 1024px. */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8">
            <ColophonCard commit={commit} />
          </div>
        </div>

        <section
          aria-labelledby="map-heading"
          data-infra-map
          class="mt-10 sm:mt-14"
        >
          <h2 id="map-heading" class="text-2xl sm:text-3xl text-parchment">
            How the pieces connect
          </h2>
          <p class="mt-2 text-graphite max-w-3xl">
            {MAP_CAPTION}{" "}
            Every box is a link, and every arrow is a fact I can point to.
          </p>
          <div class="mt-6">
            <InfraMap />
          </div>
        </section>

        <section
          aria-labelledby="cloud-heading"
          data-infra-workload
          class="mt-10 sm:mt-14"
        >
          <h2 id="cloud-heading" class="text-2xl sm:text-3xl text-parchment">
            Your cloud is fine too
          </h2>
          <p class="mt-2 text-graphite max-w-3xl">
            There is no universal template. The recommendation follows the
            workload, the team, compliance, recovery and budget.
          </p>
          <ul class="mt-6 grid gap-4 lg:grid-cols-3">
            {workload.map((w) => (
              <li
                key={w.title}
                class="bg-paper border border-rule rounded-xl p-5"
              >
                <h3 class="text-lg text-parchment mb-2">{w.title}</h3>
                <p class="text-sm text-graphite leading-relaxed">{w.text}</p>
                {w.example && (
                  <div
                    data-infra-client
                    class="mt-3 pt-3 border-t border-rule"
                  >
                    <h4 class="text-sm font-semibold text-parchment">
                      For a client: SmartLite
                    </h4>
                    <p class="mt-1 text-sm text-graphite leading-relaxed">
                      {projectLead(smartlite)} It runs on AWS.{" "}
                      <a
                        href="/work/smartlite"
                        {...eventAttrs("cta", {
                          place: "body",
                          target: "/work/smartlite",
                        })}
                        class={LINK}
                      >
                        Read the case study
                      </a>
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p class="mt-4">
            <a
              href="/blog/cost-optimization-laboratory"
              {...eventAttrs("cta", {
                place: "body",
                target: "/blog/cost-optimization-laboratory",
              })}
              class={LINK}
            >
              Managed cloud, dedicated, or hybrid: how I weigh the cost
            </a>
          </p>
        </section>

        <section
          aria-labelledby="risk-heading"
          data-infra-layers
          class="mt-10 sm:mt-14"
        >
          <h2 id="risk-heading" class="text-2xl sm:text-3xl text-parchment">
            How risk is controlled
          </h2>
          <div class="mt-6 grid gap-4 lg:grid-cols-2">
            {infraLayers.map((l) => (
              <section
                key={l.id}
                aria-labelledby={`layer-${l.id}`}
                data-infra-layer={l.id}
                class="bg-paper border border-rule rounded-xl p-4 sm:p-5"
              >
                <h3 id={`layer-${l.id}`} class="text-lg text-parchment">
                  {l.title}
                </h3>
                <p class="mt-1 text-xs text-graphite">{l.tools}</p>
                <p class="mt-3 text-sm text-graphite leading-relaxed">
                  {l.text}
                </p>
                <p class="mt-3 text-sm text-graphite">
                  <span class="font-semibold text-parchment">
                    Where to check:
                  </span>{" "}
                  {l.checks.map((c, i) => (
                    <span key={i}>
                      {i > 0 && " · "}
                      <Check c={c} />
                    </span>
                  ))}
                </p>
                {l.post && (
                  <p class="mt-2 text-sm">
                    <a href={l.post.href} class={LINK}>{l.post.label}</a>
                  </p>
                )}
              </section>
            ))}
          </div>
        </section>

        <ClosingBand
          promiseIds={["ownership", "first-milestone"]}
          bookHref={BOOK_HREF}
          links={[
            { href: WRITE_FALLBACK_HREF, label: BRIEF_LABEL },
            { href: "/how-i-work", label: "How I work" },
          ]}
        >
          <h2 class="text-lg text-parchment mb-3">
            If you want this for your product
          </h2>
          <ul data-infra-services class="mb-6 grid gap-4 sm:grid-cols-2">
            {[mvp, ongoing].map((item) => (
              <li
                key={item.slug}
                class="bg-paper border border-rule rounded-xl p-5"
              >
                <h3 class="text-lg text-parchment">{item.shortTitle}</h3>
                <p class="mt-1 price text-parchment font-semibold">
                  {priceLabel(item)}
                </p>
                <p class="mt-2 text-sm text-graphite">{item.summary}</p>
                <a
                  href={catalogPath(item.slug)}
                  {...eventAttrs("cta", {
                    place: "card",
                    target: catalogPath(item.slug),
                  })}
                  class={cn(
                    "mt-3 inline-flex items-center gap-1 text-sm",
                    LINK,
                  )}
                >
                  See what is included
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </ClosingBand>
      </div>
    </Layout>
  );
});

/** "This site": what the page you are reading is built with and where it runs, then Book and the brief. */
function ColophonCard({ commit }: { commit: string }) {
  return (
    <FactCard label="This site">
      <h2 class="text-lg text-parchment mb-3">This site</h2>
      <dl data-infra-colophon class="space-y-2 text-sm">
        <Fact term="Built with">Deno, Fresh, Preact and Tailwind</Fact>
        <Fact term="Runs in">
          Docker Compose behind Traefik on a Hetzner Cloud server in Germany
        </Fact>
        <Fact term="Checked by">Woodpecker runs the tests on every push</Fact>
        <Fact term="Analytics">Umami, self-hosted</Fact>
        <Fact term="Backups">A nightly restic job of the site's data</Fact>
        <Fact term="Source">
          <a href={REPO} target="_blank" rel="noopener noreferrer" class={LINK}>
            spy4x/antonshubin.com
            <NewTabHint />
          </a>
        </Fact>
        <Fact term="This build">
          {commit
            ? (
              <a
                href={`${REPO}/commit/${commit}`}
                target="_blank"
                rel="noopener noreferrer"
                class={cn(LINK, "break-all")}
              >
                {commit.slice(0, 7)}
                <NewTabHint />
              </a>
            )
            : "a local build"}
        </Fact>
      </dl>
      <div class="mt-5 flex flex-col gap-3">
        <BookCallLink
          url={BOOK_HREF}
          event={eventAttrs("book", { place: "card" })}
          class="justify-center px-6 py-3"
        >
          {BOOK_LABEL}
        </BookCallLink>
        <Button
          href={WRITE_FALLBACK_HREF}
          {...eventAttrs("brief", { place: "card" })}
          class="justify-center px-6 py-3"
        >
          {BRIEF_LABEL}
        </Button>
      </div>
    </FactCard>
  );
}
