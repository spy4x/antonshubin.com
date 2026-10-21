import { define } from "../../lib/utils.ts"
import { getBreadcrumb, head } from "../../lib/head.ts"
import { SEOHead } from "../../components/SEOHead.tsx"
import { Breadcrumb } from "../../components/Breadcrumb.tsx"
import { Layout } from "../../components/Layout.tsx"
import { ClosingBand } from "../../components/ClosingBand.tsx"
import { HubTools } from "../../components/tools/hub/HubTools.tsx"
import { hubOrder } from "../../components/tools/hub/hub.ts"
import { StatusMark } from "@spy4x/preact-ui/status-mark"
import { IconArrowRight } from "@spy4x/preact-icons"
import { toJsonLd } from "../../lib/json-ld.ts"
import {
  statusMeanings,
  tool as toolBySlug,
  type ToolStatus,
} from "../../lib/tools.ts"
import { checkedLabel, toolsLive } from "../../lib/tools-live.ts"
import { eventAttrs } from "../../lib/analytics.ts"

/** The H1 #189 sets for the hub, reused as the page name. */
const TITLE = "Tools I build and run myself"
const CANONICAL = "https://antonshubin.com/tools"

// The curated hub (#456): Seed's clip first, then what runs live, what runs
// in a terminal, the building blocks, the work in progress and the archive,
// in the hand-set order of components/tools/hub/hub.ts.
export default define.page(async function ToolsIndex(ctx) {
  const live = await toolsLive()
  const order = hubOrder().map(toolBySlug)

  head.value = {
    ...head.value,
    title: `${TITLE} — Anton Shubin`,
    pageName: "Tools",
    description:
      "Tools Anton Shubin builds and uses in his own work: libraries, services and apps, each with its status.",
    canonical: CANONICAL,
    ogType: "website",
    ogImage: "https://antonshubin.com/img/og/tools.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${CANONICAL}#page`,
    "name": TITLE,
    "url": CANONICAL,
    "author": { "@id": "https://antonshubin.com/#person" },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": order.length,
      "itemListElement": order.map((t, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": t.name,
        "url": `https://antonshubin.com/tools/${t.slug}`,
      })),
    },
  }

  const statuses = Object.entries(statusMeanings) as [ToolStatus, string][]

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb items={getBreadcrumb(head.value.canonical, "Tools")} />
        <h1 class="text-3xl sm:text-5xl text-parchment leading-tight">
          {TITLE}
        </h1>
        <p class="mt-4 max-w-2xl text-graphite text-base sm:text-lg leading-relaxed">
          I build small tools that each do one job, and I use them in my own
          work. Each entry says where it stands.
        </p>

        <HubTools live={live} />

        <ClosingBand
          promiseIds={[]}
          catalogLink={
            <a
              href="/catalog"
              {...eventAttrs("cta", { place: "band", target: "/catalog" })}
              class="inline-flex items-center gap-1 text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
            >
              Services
              <IconArrowRight class="w-3.5 h-3.5" />
            </a>
          }
        >
          <p class="mb-6 font-heading text-xl text-parchment">
            Need something like this for your team? That's my day job.
          </p>
        </ClosingBand>

        <p data-checked class="mt-10 text-sm text-graphite">
          Versions: {checkedLabel(live)}.
        </p>

        <details data-status-key class="mt-6 border-t border-rule pt-4">
          <summary class="cursor-pointer text-parchment">
            What the status marks mean
          </summary>
          <dl class="mt-4 grid gap-2 sm:grid-cols-[8rem_1fr] text-sm">
            {statuses.map(([status, meaning]) => (
              <div key={status} class="contents">
                <dt>
                  <StatusMark status={status} />
                </dt>
                <dd class="text-graphite mb-2 sm:mb-0">{meaning}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </Layout>
  )
})
