import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { Layout } from "../components/Layout.tsx";
import { SEOHead } from "../components/SEOHead.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import { buttonClass } from "../components/Button.tsx";
import { ClosingBand } from "../components/ClosingBand.tsx";
import { Fact, FactCard } from "../components/FactCard.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import StatusMark from "../components/StatusMark.tsx";
import { WithNote } from "../components/WithNote.tsx";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { projects } from "../lib/data.ts";
import { getBreadcrumb, head } from "../lib/head.ts";
import {
  edgesFrom,
  infraGroups,
  infraNode,
  infraNodes,
  liveLinks,
  mentionedToolIds,
} from "../lib/infrastructure.ts";
import { toJsonLd } from "../lib/json-ld.ts";
import { projectLead } from "../lib/llms.ts";
import { define } from "../lib/utils.ts";

const BASE = "https://antonshubin.com";
const REPO = "https://github.com/spy4x/antonshubin.com";
const BUILD_ID = Deno.env.get("BUILD_ID") || "dev";

const LINK =
  "text-parchment underline underline-offset-4 hover:text-accent focus-visible:text-accent";

/** The founder sentence the page has always led with: the buyer's questions, not tool names. */
const LEAD =
  "Founders should not need to manage infrastructure. They should know how product risk is controlled, what happens when something fails, and whether another team can take over cleanly.";

/** A live link's URL by id, so the sections and the first screen never disagree. */
function liveHref(id: string): string {
  return liveLinks.find((l) => l.id === id)!.href;
}

interface Layer {
  id: string;
  /** The job first, the tool in parentheses: a founder reads the job, a search reads the tool. */
  title: string;
  text: string;
  /** Where a visitor can check it. */
  check: { label: string; href: string; external?: boolean } | string;
}

/** The layers, in the order a founder fears them: handover, backups, failure, deploys, access. */
const layers: Layer[] = [
  {
    id: "handover",
    title: "Handing it over (versioned config in git)",
    text:
      "My own servers run on reusable infrastructure as code, Deno deployment automation, Docker Compose, and Traefik for TLS and routing. Configuration and deployment logic stay versioned rather than living as undocumented server steps, so another team can take over without asking one operator.",
    check: {
      label: "rostok, the scaffolder I deploy with",
      href: "/tools/rostok",
    },
  },
  {
    id: "backups",
    title: "Backups I can restore (restic)",
    text:
      "Restic backups run with integrity checks, retention policies, and a written restore procedure. Recovery is part of the system's design, not a command to research for the first time during an incident.",
    check: "Not public: backups hold client and personal data.",
  },
  {
    id: "monitoring",
    title: "Knowing when it breaks (Gatus, zond, VictoriaMetrics)",
    text:
      "Gatus checks service health and VictoriaMetrics records operational signals. Zond lets Gatus check services that sit behind an SSO proxy. Customer-facing availability stays separate from the deeper measurements, so a failure arrives with diagnostic context.",
    check: {
      label: "The status page",
      href: liveHref("dash"),
      external: true,
    },
  },
  {
    id: "deploys",
    title: "Deploys and builds (Woodpecker, Docker Compose)",
    text:
      "A release follows a documented, repeatable path instead of one person's memory. Woodpecker builds the repositories, and the deploy is a versioned script.",
    check: {
      label: "The pipelines",
      href: liveHref("ci"),
      external: true,
    },
  },
  {
    id: "access",
    title: "Sign-in and routing (Authelia, Traefik)",
    text:
      "Authelia provides centralized SSO and 2FA, and Traefik handles TLS and routing. Access stays explicit, with boundaries another team can read.",
    check: "Not public: the configuration names internal services.",
  },
];

/** The three rows of "your cloud is fine too", from the page's earlier workload section. */
const workload = [
  {
    title: "Self-hosted",
    text:
      "Open-source and self-hostable by default, for cost discipline, performance, portability, and auditability. Dedicated hardware when the workload justifies it: single-tenant CPU, NVMe, predictable cost.",
  },
  {
    title: "Managed cloud",
    text:
      "AWS, GCP, Supabase, and friends when they remove meaningful operational risk, satisfy compliance needs, or let a small team move faster.",
  },
  {
    title: "Hybrid",
    text:
      "Managed services where they remove risk, stable workloads on dedicated hardware where control and capacity matter more.",
  },
];

/** The four posts that cover a layer, each linked in the section it belongs to. */
const posts = [
  {
    href: "/blog/rostok-self-hosted-scaffolder",
    label: "rostok: scaffold a self-hosted homelab",
  },
  {
    href: "/blog/zond-sso-probe-bridge",
    label: "zond: a probe bridge so Gatus can see through your SSO proxy",
  },
  {
    href: "/blog/mig-tiny-self-hosted-scheduler",
    label: "mig: the tiny scheduler behind the booking page",
  },
];

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

        <header class="max-w-3xl" data-infra-hero>
          <h1 class="text-3xl sm:text-5xl text-parchment text-balance">
            How I run production
          </h1>
          <p class="mt-4 text-graphite text-base sm:text-xl leading-relaxed">
            {LEAD}
          </p>
          <p class="mt-3 text-graphite leading-relaxed">
            Deployable, observable, recoverable and transferable: Docker Compose
            behind Traefik, Authelia for sign-in, restic for backups, Gatus for
            checks and Woodpecker for builds.
          </p>
        </header>

        <section
          aria-labelledby="see-running"
          data-infra-live
          class="mt-8 max-w-3xl"
        >
          <h2 id="see-running" class="text-lg text-parchment">
            See it running
          </h2>
          <WithNote id="infra-live-checked" class="note-stack">
            <ul class="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              {liveLinks.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-live-link={l.id}
                    data-umami-event={`infrastructure-live-${l.id}`}
                    class={buttonClass(
                      "secondary",
                      "w-full sm:w-auto justify-between gap-2 px-4 py-2.5 text-sm break-all",
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
            A red tile on the status page means something is down now, and you
            see it when I do.
          </p>
          <div class="mt-5">
            <BookCallLink
              url={SCHEDULE_URL}
              target="_blank"
              data-umami-event="infrastructure-book-top"
              class="justify-center px-6 py-3"
            >
              Book a free intro call
            </BookCallLink>
          </div>
        </section>

        <section
          aria-labelledby="map-heading"
          data-infra-map
          class="mt-14"
        >
          <h2 id="map-heading" class="text-2xl sm:text-3xl text-parchment">
            How the pieces connect
          </h2>
          <p class="mt-2 text-graphite max-w-3xl">
            Every box is a link, and every arrow is a fact I can point to.
          </p>
          <ol class="mt-6 grid gap-8 lg:grid-cols-4 lg:gap-6">
            {infraGroups.map((g) => (
              <li key={g.id} data-infra-group={g.id}>
                <h3 class="text-lg text-parchment mb-3">{g.title}</h3>
                <ul class="space-y-3">
                  {infraNodes.filter((n) => n.group === g.id).map((n) => (
                    <li
                      key={n.id}
                      id={`node-${n.id}`}
                      data-infra-node={n.id}
                      class="bg-paper border border-rule rounded-xl p-4 scroll-mt-24"
                    >
                      <a
                        href={n.href}
                        {...(n.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        data-umami-event={`infrastructure-node-${n.id}`}
                        class={`${LINK} font-semibold break-all`}
                      >
                        {n.label}
                        {n.external && <NewTabHint />}
                      </a>
                      <p class="mt-1 text-sm text-graphite">{n.job}</p>
                      {edgesFrom(n.id).length > 0 && (
                        <ul class="mt-3 space-y-1 border-l-2 border-rule-strong pl-3 text-sm">
                          {edgesFrom(n.id).map((e) => (
                            <li key={`${e.from}-${e.to}`} data-infra-edge>
                              <span class="font-semibold text-parchment">
                                {e.verb}
                              </span>{" "}
                              <a
                                href={`#node-${e.to}`}
                                class={`${LINK} break-all`}
                              >
                                {infraNode(e.to).label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="client-heading"
          data-infra-client
          class="mt-14 max-w-3xl"
        >
          <h2 id="client-heading" class="text-2xl sm:text-3xl text-parchment">
            For a client: SmartLite
          </h2>
          <p class="mt-3 text-graphite leading-relaxed">
            Everything above is my own setup. A client system is a different
            one: {projectLead(smartlite)}
          </p>
          <p class="mt-3 text-sm text-graphite">
            It runs on AWS.{" "}
            <a
              href="/work/smartlite"
              data-umami-event="infrastructure-smartlite"
              class={LINK}
            >
              Read the case study
            </a>
          </p>
        </section>

        <div class="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
          <div class="space-y-12 max-w-3xl">
            {layers.map((l) => (
              <section
                key={l.id}
                aria-labelledby={`layer-${l.id}`}
                data-infra-layer={l.id}
              >
                <h2
                  id={`layer-${l.id}`}
                  class="text-2xl text-parchment text-balance"
                >
                  {l.title}
                </h2>
                <p class="mt-3 text-graphite leading-relaxed">{l.text}</p>
                <p class="mt-3 text-sm text-graphite">
                  <span class="font-semibold text-parchment">
                    Where to check:
                  </span>{" "}
                  {typeof l.check === "string" ? l.check : (
                    <a
                      href={l.check.href}
                      {...(l.check.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      class={LINK}
                    >
                      {l.check.label}
                      {l.check.external && <NewTabHint />}
                    </a>
                  )}
                </p>
              </section>
            ))}
            <section aria-labelledby="posts-heading" data-infra-posts>
              <h2 id="posts-heading" class="text-2xl text-parchment">
                Written up
              </h2>
              <ul class="mt-3 space-y-2">
                {posts.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} class={LINK}>{p.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div class="lg:sticky lg:top-8 self-start">
            <ColophonCard commit={commit} />
          </div>
        </div>

        <section
          aria-labelledby="cloud-heading"
          data-infra-workload
          class="mt-14"
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
              </li>
            ))}
          </ul>
          <p class="mt-4">
            <a
              href="/blog/cost-optimization-laboratory"
              data-umami-event="infrastructure-cost-post"
              class={LINK}
            >
              Managed cloud, dedicated, or hybrid: how I weigh the cost
            </a>
          </p>
        </section>

        <section
          aria-labelledby="hand-off"
          data-infra-services
          class="mt-14"
        >
          <h2 id="hand-off" class="text-2xl sm:text-3xl text-parchment">
            If you want this for your product
          </h2>
          <ul class="mt-6 grid gap-4 sm:grid-cols-2">
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
                  data-umami-event={`infrastructure-catalog-${item.slug}`}
                  class={`mt-3 inline-flex items-center gap-1 text-sm ${LINK}`}
                >
                  See what is included
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <ClosingBand
          bookEvent="infrastructure-book-call"
          promiseIds={["ownership", "first-milestone"]}
          links={[
            {
              href: "/#audit-form",
              label: "Request a free written audit",
              event: "infrastructure-audit",
            },
            {
              href: "/how-i-work",
              label: "How I work",
              event: "infrastructure-how-i-work",
            },
          ]}
        />
      </div>
    </Layout>
  );
});

/** "This site": what the page you are reading is built with and where it runs. */
function ColophonCard({ commit }: { commit: string }) {
  return (
    <FactCard label="This site">
      <h2 class="text-lg text-parchment mb-3">This site</h2>
      <dl data-infra-colophon class="space-y-2 text-sm">
        <Fact term="Built with">Deno, Fresh, Preact and Tailwind</Fact>
        <Fact term="Runs in">
          Docker Compose behind Traefik on my own server
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
                class={`${LINK} break-all`}
              >
                {commit.slice(0, 7)}
                <NewTabHint />
              </a>
            )
            : "a local build"}
        </Fact>
      </dl>
    </FactCard>
  );
}
