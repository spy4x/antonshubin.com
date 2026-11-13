import { cn } from "@spy4x/preact-cn"
import { FACT_LINK } from "../FactCard.tsx"
import { ShowcaseFeatures } from "../ToolShowcase.tsx"
import { heroStill, summaryAfterLede, type ToolPageData } from "./tool-page.ts"

/**
 * The default middle (frame part 4): the entry's "What you get" cards, credit, live proof, summary, packages, the
 * screenshots the hero does not already show, its links to other repos and
 * where it stands. Each block renders only when the entry has data for it.
 */
export function DefaultMiddle({ data }: { data: ToolPageData }) {
  const { tool } = data
  const shots = (tool.screenshots ?? []).filter((s) => s !== heroStill(tool))
  // An entry with its own `lede` says what it is there (#454).
  const about = tool.lede ? "" : summaryAfterLede(tool)
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
  )
}
