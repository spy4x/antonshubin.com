import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { ToolCard, ToolRowCard } from "../../components/ToolCard.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import {
  groupedTools,
  statusMeanings,
  type ToolStatus,
} from "../../lib/tools.ts";
import { checkedLabel, toolsLive } from "../../lib/tools-live.ts";
import { eventAttrs } from "../../lib/analytics.ts";

/** The H1 #189 sets for the hub, reused as the page name. */
const TITLE = "Tools I build and run myself";
const CANONICAL = "https://antonshubin.com/tools";

export default define.page(async function ToolsIndex(ctx) {
  const live = await toolsLive();
  const groups = groupedTools();
  const pageTools = groups.flatMap((g) => g.tools);

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
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${CANONICAL}#page`,
    "name": TITLE,
    "url": CANONICAL,
    "author": { "@id": "https://antonshubin.com/#person" },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": pageTools.length,
      "itemListElement": pageTools.map((t, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": t.name,
        "url": `https://antonshubin.com/tools/${t.slug}`,
      })),
    },
  };

  const statuses = Object.entries(statusMeanings) as [ToolStatus, string][];

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
      <div class="max-w-5xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb items={getBreadcrumb(head.value.canonical, "Tools")} />
        <h1 class="text-3xl sm:text-4xl text-parchment mb-4">{TITLE}</h1>
        <p class="text-graphite text-base sm:text-lg max-w-2xl">
          I build small tools that each do one job, and I use them in my own
          work. Each entry says where it stands. Need something like this for
          your team? That's my day job.{" "}
          <a
            href="/catalog"
            {...eventAttrs("cta", { place: "body", target: "/catalog" })}
            class="text-accent underline underline-offset-4"
          >
            Services
          </a>
        </p>

        {groups.map(({ group, tools, rows }) => (
          <section
            key={group.id}
            aria-labelledby={`group-${group.id}`}
            data-tool-group={group.id}
            class="mt-12"
          >
            <h2 id={`group-${group.id}`} class="text-2xl text-parchment">
              {group.title}
            </h2>
            <p class="mt-1 text-graphite">{group.intro}</p>
            <ul
              class={group.layout === "compact"
                ? "mt-4"
                : group.layout === "grid"
                ? "mt-4 grid gap-4 sm:grid-cols-2"
                : "mt-4 grid gap-4"}
            >
              {tools.map((t) => (
                <ToolCard
                  key={t.slug}
                  tool={t}
                  live={live}
                  variant={group.layout === "grid"
                    ? "card"
                    : group.layout === "wide"
                    ? "wide"
                    : "compact"}
                />
              ))}
              {rows.map((r) => (
                <ToolRowCard
                  key={r.slug}
                  row={r}
                  variant={group.layout === "compact"
                    ? "compact"
                    : group.layout === "wide"
                    ? "wide"
                    : "card"}
                />
              ))}
            </ul>
          </section>
        ))}

        <p data-checked class="mt-10 text-sm text-graphite">
          CI status and versions: {checkedLabel(live)}.
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
  );
});
