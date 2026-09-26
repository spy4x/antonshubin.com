import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import StatusMark from "../../components/StatusMark.tsx";
import Button from "../../components/Button.tsx";
import { CiPill } from "../../components/CiPill.tsx";
import { InstallLine } from "../../components/InstallLine.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import { ciUrl, findTool, repoUrl, type Tool, tools } from "../../lib/tools.ts";
import {
  githubSnapshot,
  MIN_STARS_SHOWN,
  repoSnapshot,
} from "../../lib/github-snapshot.ts";

/**
 * The tool's `SoftwareSourceCode` JSON-LD node, from registry fields only.
 * `version` is left out until the version is really on its registry.
 */
function toolJsonLd(tool: Tool, canonical: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${canonical}#tool`,
    "name": tool.name,
    "description": tool.summary,
    "url": canonical,
    "codeRepository": repoUrl(tool),
    "programmingLanguage": "TypeScript",
    "license": `https://spdx.org/licenses/${tool.licence}`,
    ...(tool.registry.published ? { "version": tool.registry.version } : {}),
    "author": { "@id": "https://antonshubin.com/#person" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
  };
}

/** One row of the fact card. */
function Fact(
  { label, children }: { label: string; children: preact.ComponentChildren },
) {
  return (
    <div class="py-3 border-t border-rule first:border-t-0">
      <dt class="text-xs uppercase tracking-wider text-graphite">{label}</dt>
      <dd class="mt-1 text-parchment">{children}</dd>
    </div>
  );
}

const linkClass = "text-accent underline underline-offset-4";

// An unknown slug answers a real 404, like /work/<slug>, so a removed
// tool page drops out of search instead of indexing an empty 200.
export const handler = define.handlers({
  GET(ctx) {
    return findTool(ctx.params.slug) ? page() : page(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  },
});

export default define.page(function ToolPage(ctx) {
  const tool = findTool(ctx.params.slug);

  if (!tool) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl text-parchment mb-4">Not Found</h1>
          <p class="text-graphite mb-6">
            There is no tool at this address.
          </p>
          <a href="/tools" class={linkClass}>All tools</a>
        </div>
      </Layout>
    );
  }

  const snap = repoSnapshot(tool.repo);
  const others = tools.filter((t) => t.slug !== tool.slug);

  head.value = {
    ...head.value,
    title: `${tool.name}: ${tool.job} — Anton Shubin`,
    pageName: tool.name,
    description: tool.summary,
    canonical: `https://antonshubin.com/tools/${tool.slug}`,
    ogType: "article",
    ogImage: `https://antonshubin.com/img/og/tools/${tool.slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(toolJsonLd(tool, head.value.canonical)),
        }}
      />
      <div class="max-w-5xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb items={getBreadcrumb(head.value.canonical, tool.name)} />

        <header class="max-w-3xl">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {tool.name}: {tool.job}
          </h1>
          <p class="mt-4 text-graphite text-base sm:text-lg leading-relaxed">
            {tool.summary}
          </p>
          {tool.credit && (
            <p data-credit class="mt-4 text-parchment">
              {tool.credit.text}{" "}
              {tool.credit.links.map((l, i) => (
                <span key={l.href}>
                  {i > 0 && " · "}
                  <a href={l.href} class={linkClass}>{l.label}</a>
                </span>
              ))}
            </p>
          )}
          <div class="mt-6 flex flex-wrap gap-3">
            <Button href="#install" class="px-4 py-2.5 text-sm">
              Install
            </Button>
            <Button href={repoUrl(tool)} class="px-4 py-2.5 text-sm">
              GitHub
            </Button>
            {tool.live && (
              <Button href={tool.live.href} class="px-4 py-2.5 text-sm">
                {tool.live.label}
              </Button>
            )}
          </div>
        </header>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          <aside
            aria-labelledby="facts"
            class="lg:order-2 lg:sticky lg:top-8 bg-paper border border-rule rounded-xl p-5"
          >
            <h2 id="facts" class="text-lg text-parchment mb-2">Facts</h2>
            <dl data-fact-card>
              <Fact label="Status">
                <StatusMark status={tool.status} />
              </Fact>
              <Fact label="Version">
                <span data-version>
                  {tool.registry.published
                    ? tool.registry.version
                    : `${tool.registry.version}, publishing to ${tool.registry.name}`}
                </span>
              </Fact>
              <Fact label="Licence">{tool.licence}</Fact>
              <Fact label="Runs on">{tool.runtime}</Fact>
              <Fact label="Registry">
                <a href={tool.registry.url} class={linkClass}>
                  {tool.registry.name}
                </a>
              </Fact>
              {tool.live && (
                <Fact label="Live">
                  <a href={tool.live.href} class={linkClass}>
                    {tool.live.label}
                  </a>
                </Fact>
              )}
              <Fact label="Repository">
                <a href={repoUrl(tool)} class={linkClass}>{tool.repo}</a>
                {snap.stars >= MIN_STARS_SHOWN && (
                  <span class="text-graphite">, {snap.stars} stars</span>
                )}
              </Fact>
              <Fact label="CI">
                <CiPill ci={snap.ci} pipelinesUrl={ciUrl(tool)} labelHidden />
                <span class="block mt-1 text-sm text-graphite">
                  Checked {githubSnapshot.checkedOn}
                </span>
              </Fact>
              <Fact label="Install">
                <InstallLine tool={tool} id={`fact-install-${tool.slug}`} />
              </Fact>
            </dl>
          </aside>

          <div class="lg:order-1 min-w-0 space-y-12">
            <section aria-labelledby="proof">
              <h2 id="proof" class="text-2xl text-parchment">Live proof</h2>
              <p class="mt-3 text-graphite leading-relaxed">{tool.usedFor}</p>
              <ul class="mt-3 space-y-1">
                {tool.proofLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} class={linkClass}>{l.label}</a>
                  </li>
                ))}
              </ul>
              {tool.screenshots?.map((s) => (
                <figure
                  key={s.src}
                  class="mt-6 bg-paper border border-rule rounded-xl p-3"
                >
                  <img
                    src={s.src}
                    alt={s.alt}
                    width={s.width}
                    height={s.height}
                    loading="lazy"
                    class="w-full h-auto rounded-lg"
                  />
                </figure>
              ))}
            </section>

            <section aria-labelledby="install">
              <h2 id="install" class="text-2xl text-parchment">Install</h2>
              <div class="mt-3">
                <InstallLine tool={tool} id={`install-${tool.slug}`} />
              </div>
              {tool.packages && (
                <>
                  <p class="mt-4 text-graphite">
                    {tool.packages.length} packages, each installed on its own:
                  </p>
                  <ul class="mt-2 flex flex-wrap gap-2">
                    {tool.packages.map((p) => (
                      <li key={p}>
                        <code class="text-sm">{p}</code>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section aria-labelledby="fit" class="grid gap-8 sm:grid-cols-2">
              <div>
                <h2 id="fit" class="text-xl text-parchment">Use it if</h2>
                <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                  {tool.useIf.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
              <div>
                <h2 class="text-xl text-parchment">Don't use it if</h2>
                <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                  {tool.dontUseIf.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </section>

            <section aria-labelledby="fits">
              <h2 id="fits" class="text-2xl text-parchment">
                How it fits with my other repos
              </h2>
              <ul class="mt-4 space-y-3">
                {tool.fits.map((f) => (
                  <li
                    key={f.text}
                    data-relation={f.planned ? "planned" : "true"}
                    class={`pl-4 border-l-2 ${
                      f.planned
                        ? "border-dashed border-rule-strong"
                        : "border-solid border-sage"
                    }`}
                  >
                    <span class="text-xs uppercase tracking-wider text-graphite">
                      {f.planned ? "Planned" : "Today"}
                    </span>
                    <p class="text-parchment">
                      {f.href
                        ? <a href={f.href} class={linkClass}>{f.text}</a>
                        : f.text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="next"
              class="border-t border-rule pt-8 grid gap-6 sm:grid-cols-2"
            >
              <h2 id="next" class="sr-only">What next</h2>
              <div>
                <p class="text-parchment">Star it or open an issue.</p>
                <a href={`${repoUrl(tool)}/issues`} class={linkClass}>
                  {tool.repo} on GitHub
                </a>
              </div>
              <div>
                <p class="text-parchment">
                  Need something like this for your team? That's my day job.
                </p>
                <a href="/catalog" class={linkClass}>Services</a>
              </div>
            </section>

            {others.length > 0 && (
              <nav aria-label="Other tools" class="text-sm text-graphite">
                Other tools: {others.map((t, i) => (
                  <span key={t.slug}>
                    {i > 0 && " · "}
                    <a href={`/tools/${t.slug}`} class={linkClass}>{t.name}</a>
                  </span>
                ))} · <a href="/tools" class={linkClass}>All tools</a>
              </nav>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
});
