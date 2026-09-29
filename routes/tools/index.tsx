import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import StatusMark from "../../components/StatusMark.tsx";
import { CiPill } from "../../components/CiPill.tsx";
import { InstallLine } from "../../components/InstallLine.tsx";
import {
  ciUrl,
  groupedTools,
  statusMeanings,
  type Tool,
  toolLicence,
  type ToolRow as ToolRowEntry,
  type ToolStatus,
} from "../../lib/tools.ts";
import { githubSnapshot, repoSnapshot } from "../../lib/github-snapshot.ts";

/** The H1 #189 sets for the hub, reused as the page name. */
const TITLE = "Tools I build and run myself";

/** One tool in its group: status, version, CI and install, linking to its page. */
function ToolRow({ tool }: { tool: Tool }) {
  const snap = tool.repo ? repoSnapshot(tool.repo) : null;
  return (
    <li
      data-tool={tool.slug}
      class="py-6 border-t border-rule first:border-t-0"
    >
      <h3 class="text-xl text-parchment">
        <a
          href={`/tools/${tool.slug}`}
          class="hover:text-accent underline-offset-4 hover:underline"
        >
          {tool.name}
        </a>
      </h3>
      <p class="mt-1 text-graphite">{tool.job}.</p>
      {tool.credit && (
        <p data-credit class="mt-1 text-sm text-parchment">
          {tool.credit.text}{" "}
          {tool.credit.links.map((l, i) => (
            <span key={l.href}>
              {i > 0 && " · "}
              <a href={l.href} class="text-accent underline underline-offset-4">
                {l.label}
              </a>
            </span>
          ))}
        </p>
      )}
      {tool.live && (
        <p class="mt-1">
          <a
            href={tool.live.href}
            class="text-accent underline underline-offset-4"
          >
            {tool.live.label}
          </a>
        </p>
      )}
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-graphite">
        <StatusMark status={tool.status} />
        {tool.registry && (
          <span data-version>
            {tool.registry.published
              ? `${tool.registry.version} on ${tool.registry.name}`
              : `Publishing ${tool.registry.version} to ${tool.registry.name}`}
          </span>
        )}
        {tool.ci && snap && <CiPill ci={snap.ci} pipelinesUrl={ciUrl(tool)!} />}
        {toolLicence(tool) && <span>{toolLicence(tool)}</span>}
      </div>
      {tool.registry && (
        <div class="mt-3">
          <InstallLine tool={tool} id={`install-${tool.slug}`} />
        </div>
      )}
    </li>
  );
}

/** A project with no page yet: its name, status and links. */
function ToolLinkRow({ row }: { row: ToolRowEntry }) {
  return (
    <li
      data-tool={row.slug}
      class="py-6 border-t border-rule first:border-t-0"
    >
      <h3 class="text-xl text-parchment">{row.name}</h3>
      {row.note && <p class="mt-1 text-graphite">{row.note}</p>}
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <StatusMark status={row.status} />
        {row.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            class="text-accent underline underline-offset-4"
          >
            {l.label}
          </a>
        ))}
      </div>
    </li>
  );
}

export default define.page(function ToolsIndex(ctx) {
  head.value = {
    ...head.value,
    title: `${TITLE} — Anton Shubin`,
    pageName: "Tools",
    description:
      "Tools Anton Shubin builds and uses in his own work: libraries, services and apps, each with its status.",
    canonical: "https://antonshubin.com/tools",
    ogType: "website",
    ogImage: "https://antonshubin.com/img/og/tools.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  const statuses = Object.entries(statusMeanings) as [ToolStatus, string][];

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb items={getBreadcrumb(head.value.canonical, "Tools")} />
        <h1 class="text-3xl sm:text-4xl text-parchment mb-4">{TITLE}</h1>
        <p class="text-graphite text-base sm:text-lg max-w-2xl">
          I build small tools that each do one job, and I use them in my own
          work. Each entry says where it stands, and its CI status was last
          checked on{" "}
          {githubSnapshot.checkedOn}. Need something like this for your team?
          That's my day job.{" "}
          <a
            href="/catalog"
            class="text-accent underline underline-offset-4"
          >
            Services
          </a>
        </p>

        <section aria-labelledby="status-key" class="mt-10">
          <h2 id="status-key" class="text-lg text-parchment mb-3">
            Status key
          </h2>
          <dl class="grid gap-2 sm:grid-cols-[8rem_1fr] text-sm">
            {statuses.map(([status, meaning]) => (
              <div key={status} class="contents">
                <dt>
                  <StatusMark status={status} />
                </dt>
                <dd class="text-graphite mb-2 sm:mb-0">{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        {groupedTools().map(({ group, tools, rows }) => (
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
            <ul class="mt-4">
              {tools.map((t) => <ToolRow key={t.slug} tool={t} />)}
              {rows.map((r) => <ToolLinkRow key={r.slug} row={r} />)}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  );
});
