import { cn } from "@spy4x/preact-cn";
import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { InstallLine } from "../../components/InstallLine.tsx";
import { FACT_LINK } from "../../components/FactCard.tsx";
import { findTool } from "../../lib/tools.ts";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import {
  heroStill,
  loadToolPage,
  summaryAfterLede,
  type ToolPageData,
} from "../../components/tool-frame/tool-page.ts";
import { QuickStart } from "../../components/tool-frame/ToolBand.tsx";
import { ShowcaseFeatures } from "../../components/ToolShowcase.tsx";

// The page of every tool without a custom route of its own. A custom page is
// `routes/tools/<slug>.tsx`, which Fresh matches before this one; both build
// on `components/tool-frame/` (#454).

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

/**
 * The middle (frame part 4) of a page with no custom route: the entry's
 * "What you get" cards, credit, live proof, summary, packages, the
 * screenshots the hero does not already show, its links to other repos and
 * where it stands. Each block renders only when the entry has data for it.
 */
function DefaultMiddle({ data }: { data: ToolPageData }) {
  const { tool } = data;
  const shots = (tool.screenshots ?? []).filter((s) => s !== heroStill(tool));
  // An entry with its own `lede` says what it is there (#454).
  const about = tool.lede ? "" : summaryAfterLede(tool);
  return (
    <>
      <ShowcaseFeatures tool={tool} />
      {tool.credit && (
        <p data-credit class="text-parchment">
          {tool.credit.text}{" "}
          {tool.credit.links.map((l, i) => (
            <span key={l.href}>
              {i > 0 && " · "}
              <a href={l.href} class={FACT_LINK}>{l.label}</a>
            </span>
          ))}
        </p>
      )}
      {!tool.features && (about || tool.packages) && (
        <section aria-labelledby="what" class="max-w-3xl">
          <h2 id="what" class="text-2xl text-parchment">What it is</h2>
          {about && <p class="mt-3 text-graphite leading-relaxed">{about}</p>}
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
      )}
      {tool.proofLinks && (
        <section aria-labelledby="proof">
          <h2 id="proof" class="text-2xl text-parchment">Live proof</h2>
          <ul class="mt-3 space-y-1">
            {tool.proofLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} class={FACT_LINK}>{l.label}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {shots.length > 0 && (
        <section aria-labelledby="screenshots">
          <h2 id="screenshots" class="text-2xl text-parchment">
            Screenshots
          </h2>
          <ul class="mt-4 grid gap-5 sm:grid-cols-2">
            {shots.map((shot) => (
              <li key={shot.src}>
                <img
                  src={shot.src}
                  srcset={shot.srcset}
                  sizes={shot.srcset
                    ? "(min-width: 1024px) 34rem, (min-width: 640px) 50vw, 100vw"
                    : undefined}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  loading="lazy"
                  decoding="async"
                  class="block w-full h-auto rounded-lg border border-rule"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      {(tool.fits?.length ?? 0) > 0 && (
        <section aria-labelledby="fits" class="max-w-3xl">
          <h2 id="fits" class="text-2xl text-parchment">
            How it fits with my other repos
          </h2>
          <ul class="mt-4 space-y-3">
            {tool.fits!.map((f) => (
              <li
                key={f.text}
                data-relation={f.planned ? "planned" : "true"}
                class={cn(
                  "pl-4 border-l-2",
                  f.planned
                    ? "border-dashed border-rule-strong"
                    : "border-solid border-sage",
                )}
              >
                <span class="text-xs uppercase tracking-wider text-graphite">
                  {f.planned ? "Planned" : "Today"}
                </span>
                <p class="text-parchment">
                  {f.href
                    ? <a href={f.href} class={FACT_LINK}>{f.text}</a>
                    : f.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tool.standing && tool.usedFor && (
        <section aria-labelledby="standing" class="max-w-3xl">
          <h2 id="standing" class="text-2xl text-parchment">
            Where it stands
          </h2>
          <p class="mt-3 text-graphite leading-relaxed">{tool.standing}</p>
        </section>
      )}
    </>
  );
}

/** The line under the hero's actions: the install or quick-start command. */
function HeroCommand({ data }: { data: ToolPageData }) {
  const { tool } = data;
  if (tool.registry) {
    return <InstallLine tool={tool} id={`install-${tool.slug}`} />;
  }
  return <QuickStart tool={tool} id={`quick-start-${tool.slug}`} />;
}

export default define.page(async function ToolPage(ctx) {
  const data = await loadToolPage(ctx.params.slug);
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  const { tool } = data;
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={tool.registry || tool.quickStart
        ? { children: <HeroCommand data={data} /> }
        : undefined}
    >
      <DefaultMiddle data={data} />
    </ToolFrame>
  );
});
