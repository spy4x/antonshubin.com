import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import StatusMark from "../../components/StatusMark.tsx";
import Button from "../../components/Button.tsx";
import { CiPill } from "../../components/CiPill.tsx";
import { Fact, FactCard } from "../../components/FactCard.tsx";
import { InstallLine } from "../../components/InstallLine.tsx";
import { ToolCard } from "../../components/ToolCard.tsx";
import ImageGallery from "../../islands/ImageGallery.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import { catalogItem, catalogPath } from "../../lib/catalog.ts";
import { blogArticles } from "../../lib/data.ts";
import { firstSentence, metaDescription } from "../../lib/llms.ts";
import {
  ciUrl,
  findTool,
  repoUrl,
  type Tool,
  toolLicence,
  tools,
} from "../../lib/tools.ts";
import { MIN_STARS_SHOWN } from "../../lib/github-snapshot.ts";
import {
  checkedLabel,
  liveRepo,
  toolsLive,
  withLiveVersion,
} from "../../lib/tools-live.ts";

const SITE = "https://antonshubin.com";
const linkClass = "text-accent underline underline-offset-4";

/**
 * The tool's `SoftwareSourceCode` JSON-LD node, from registry fields only.
 * A field the entry has no data for is left out, never guessed: `version`
 * until the version is really on its registry, `programmingLanguage` when it
 * is not written down, `license` when neither the entry nor GitHub names one.
 * No rating, review or offer.
 */
function sourceCodeJsonLd(tool: Tool, url: string) {
  const licence = toolLicence(tool);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${url}#tool`,
    "name": tool.name,
    "description": tool.summary,
    "url": url,
    "codeRepository": repoUrl(tool),
    ...(tool.programmingLanguage
      ? { "programmingLanguage": tool.programmingLanguage }
      : {}),
    ...(licence
      ? { "license": `https://spdx.org/licenses/${licence}` }
      : {}),
    ...(tool.registry?.published ? { "version": tool.registry.version } : {}),
    "author": { "@id": `${SITE}/#person` },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
  };
}

/**
 * `SoftwareApplication` for a tool someone can run. Its `url` is only ever a
 * running public instance (`live`), never the repository.
 */
function applicationJsonLd(tool: Tool, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#app`,
    "name": tool.name,
    "description": tool.summary,
    ...(tool.appCategory ? { "applicationCategory": tool.appCategory } : {}),
    ...(tool.live
      ? {
        "url": tool.live.href.startsWith("/")
          ? `${SITE}${tool.live.href}`
          : tool.live.href,
      }
      : {}),
    "author": { "@id": `${SITE}/#person` },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
  };
}

/** Up to `count` other tools for the strip at the foot: same group first, then the rest. */
function moreTools(tool: Tool, count = 3): Tool[] {
  const others = tools.filter((t) => t.slug !== tool.slug);
  return [
    ...others.filter((t) => t.group === tool.group),
    ...others.filter((t) => t.group !== tool.group),
  ].slice(0, count);
}

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

export default define.page(async function ToolPage(ctx) {
  const found = findTool(ctx.params.slug);

  if (!found) {
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

  const live = await toolsLive();
  const tool = withLiveVersion(found, live);
  const snap = liveRepo(tool, live);
  const licence = toolLicence(tool);
  const repo = repoUrl(tool);
  const canonical = `${SITE}/tools/${tool.slug}`;
  const lead = tool.usedFor ?? tool.standing ?? firstSentence(tool.summary);
  const posts = (tool.posts ?? []).map((slug) => {
    const post = blogArticles.find((a) => a.slug === slug);
    if (!post) {
      throw new Error(`lib/tools.ts: ${tool.slug} names no post "${slug}"`);
    }
    return post;
  });
  const catalog = tool.catalogSlug ? catalogItem(tool.catalogSlug) : null;
  const event = (what: string) => `tool-${tool.slug}-${what}`;

  head.value = {
    ...head.value,
    title: `${tool.name}: ${tool.job} — Anton Shubin`,
    pageName: tool.name,
    description: metaDescription(tool.summary),
    canonical,
    ogType: "article",
    ogImage: `${SITE}/img/og/tools/${tool.slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  const hasFit = (tool.useIf?.length ?? 0) + (tool.dontUseIf?.length ?? 0) > 0;

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      {repo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(sourceCodeJsonLd(tool, canonical)),
          }}
        />
      )}
      {tool.deployable && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(applicationJsonLd(tool, canonical)),
          }}
        />
      )}
      <div class="max-w-5xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb items={getBreadcrumb(canonical, tool.name)} />

        <header class="max-w-3xl">
          <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
            {tool.name}:{" "}
            <span class="block mt-1 text-xl sm:text-2xl text-graphite">
              {tool.job}
            </span>
          </h1>
          <p class="mt-4 text-parchment text-base sm:text-lg leading-relaxed">
            {lead}
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
          <div class="mt-6">
            {tool.registry
              ? <InstallLine tool={tool} id={`install-${tool.slug}`} />
              : tool.live
              ? (
                <Button
                  href={tool.live.href}
                  data-umami-event={event("live")}
                  class="px-4 py-2.5 text-sm"
                >
                  {tool.live.label}
                </Button>
              )
              : repo && (
                <Button
                  href={repo}
                  data-umami-event={event("github")}
                  class="px-4 py-2.5 text-sm"
                >
                  GitHub
                </Button>
              )}
          </div>
        </header>

        <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          <FactCard
            id="facts"
            title="Facts"
            data-fact-card
            footer={(repo || catalog) && (
              <>
                {repo && (
                  <p>
                    <a
                      href={repo}
                      data-umami-event={event("github")}
                      class={linkClass}
                    >
                      Star on GitHub
                    </a>
                    {" · "}
                    <a
                      href={`${repo}/issues`}
                      data-umami-event={event("issue")}
                      class={linkClass}
                    >
                      Report an issue
                    </a>
                  </p>
                )}
              </>
            )}
          >
            <Fact term="Status">
              <StatusMark status={tool.status} />
            </Fact>
            {tool.registry && (
              <Fact term="Version">
                <span data-version>
                  {tool.registry.published
                    ? tool.registry.version
                    : `${tool.registry.version}, publishing to ${tool.registry.name}`}
                </span>
                {tool.registry.published && (
                  <>
                    {" on "}
                    <a href={tool.registry.url} class={linkClass}>
                      {tool.registry.name}
                    </a>
                  </>
                )}
              </Fact>
            )}
            {licence && (
              <Fact term="Licence">{licence}</Fact>
            )}
            {tool.runtime && <Fact term="Runs on">{tool.runtime}</Fact>}
            {tool.live && (
              <Fact term="Live">
                <a
                  href={tool.live.href}
                  data-umami-event={event("live")}
                  class={linkClass}
                >
                  {tool.live.label}
                </a>
              </Fact>
            )}
            {repo && (
              <Fact term="Code">
                <a href={repo} class={linkClass}>{tool.repo}</a>
                {snap && snap.stars >= MIN_STARS_SHOWN && (
                  <span class="text-graphite">, {snap.stars} stars</span>
                )}
              </Fact>
            )}
            {tool.ci && snap && (
              <Fact term="CI">
                <CiPill ci={snap.ci} pipelinesUrl={ciUrl(tool)!} labelHidden />
                <span data-checked class="block mt-1 text-graphite">
                  {checkedLabel(live)}
                </span>
              </Fact>
            )}
          </FactCard>

          <div class="lg:order-1 min-w-0 space-y-12">
            {tool.screenshots && (
              <section aria-labelledby="screenshots">
                <h2 id="screenshots" class="sr-only">Screenshots</h2>
                <ImageGallery images={tool.screenshots} hero />
              </section>
            )}

            {tool.proofLinks && (
              <section aria-labelledby="proof">
                <h2 id="proof" class="text-2xl text-parchment">Live proof</h2>
                <ul class="mt-3 space-y-1">
                  {tool.proofLinks.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} class={linkClass}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="what">
              <h2 id="what" class="text-2xl text-parchment">What it is</h2>
              <p class="mt-3 text-graphite leading-relaxed">{tool.summary}</p>
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

            {tool.standing && tool.usedFor && (
              <section aria-labelledby="standing">
                <h2 id="standing" class="text-2xl text-parchment">
                  Where it stands
                </h2>
                <p class="mt-3 text-graphite leading-relaxed">
                  {tool.standing}
                </p>
              </section>
            )}

            {hasFit && (
              <section aria-labelledby="fit" class="grid gap-8 sm:grid-cols-2">
                {(tool.useIf?.length ?? 0) > 0 && (
                  <div>
                    <h2 id="fit" class="text-xl text-parchment">Use it if</h2>
                    <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                      {tool.useIf!.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </div>
                )}
                {(tool.dontUseIf?.length ?? 0) > 0 && (
                  <div>
                    <h2
                      id={tool.useIf?.length ? undefined : "fit"}
                      class="text-xl text-parchment"
                    >
                      Don't use it if
                    </h2>
                    <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                      {tool.dontUseIf!.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {(tool.fits?.length ?? 0) > 0 && (
              <section aria-labelledby="fits">
                <h2 id="fits" class="text-2xl text-parchment">
                  How it fits with my other repos
                </h2>
                <ul class="mt-4 space-y-3">
                  {tool.fits!.map((f) => (
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
            )}

            {posts.length > 0 && (
              <section aria-labelledby="posts">
                <h2 id="posts" class="text-2xl text-parchment">
                  {posts.length > 1 ? "Posts" : "The post"}
                </h2>
                <ul class="mt-3 space-y-1">
                  {posts.map((p) => (
                    <li key={p.slug}>
                      <a
                        href={`/blog/${p.slug}`}
                        data-umami-event={event("post")}
                        class={linkClass}
                      >
                        {p.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {
          /* The two doors. The shared closing band replaces this section once
            it lands (#270); until then the doors are plain links. */
        }
        <section
          aria-labelledby="next"
          data-tool-doors
          class="mt-12 border-t border-rule pt-8 grid gap-6 sm:grid-cols-2"
        >
          <h2 id="next" class="sr-only">What next</h2>
          {repo && (
            <div>
              <p class="text-parchment">Star it or open an issue.</p>
              <a
                href={`${repo}/issues`}
                data-umami-event={event("issue")}
                class={linkClass}
              >
                {tool.repo} on GitHub
              </a>
            </div>
          )}
          <div>
            <p class="text-parchment">
              Need something like this for your team? That's my day job.
            </p>
            <a
              href={catalog ? catalogPath(catalog.slug) : "/catalog"}
              data-umami-event={event("catalog")}
              class={linkClass}
            >
              {catalog ? catalog.title : "Services"}
            </a>
          </div>
        </section>

        <section aria-labelledby="more" class="mt-12">
          <h2 id="more" class="text-2xl text-parchment">More tools</h2>
          <ul class="mt-4 grid gap-4 sm:grid-cols-3">
            {moreTools(tool).map((t) => (
              <ToolCard key={t.slug} tool={t} live={live} variant="more" />
            ))}
          </ul>
          <p class="mt-4 text-sm">
            <a href="/tools" class={linkClass}>All tools</a>
          </p>
        </section>
      </div>
    </Layout>
  );
});
