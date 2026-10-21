import { FACT_LINK } from "../../FactCard.tsx";
import { Spotlight, ToolHubCard, ToolHubLine } from "./HubParts.tsx";
import { ARCHIVE, SECTIONS, SPOTLIGHT } from "./hub.ts";
import { linkEvent } from "../../../lib/analytics.ts";
import { tool as toolBySlug } from "../../../lib/tools.ts";
import { type ToolsLive, withLiveVersion } from "../../../lib/tools-live.ts";

/**
 * The hub's tools (#456), from the spotlight to the archive, in the order of
 * `hub.ts`. Every entry is read with its live registry version, so an
 * install line shows the version the hourly refresh found.
 */
export function HubTools({ live }: { live: ToolsLive }) {
  const tool = (slug: string) => withLiveVersion(toolBySlug(slug), live);
  const archived = ARCHIVE.map(tool);
  return (
    <>
      <Spotlight tool={tool(SPOTLIGHT)} />

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`hub-${section.id}`}
          data-hub-section={section.id}
          class="mt-16"
        >
          <h2 id={`hub-${section.id}`} class="text-2xl text-parchment">
            {section.title}
          </h2>
          {section.intro && <p class="mt-1 text-graphite">{section.intro}</p>}
          {section.kind === "line"
            ? (
              <ul class="mt-4">
                {section.slugs.map(tool).map((t) => (
                  <ToolHubLine
                    key={t.slug}
                    tool={t}
                    text={t.standing ?? `${t.job}.`}
                  />
                ))}
              </ul>
            )
            : (
              <ul
                class={section.kind === "media"
                  ? "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "mt-6 grid gap-6 sm:grid-cols-2"}
              >
                {section.slugs.map(tool).map((t) => (
                  <ToolHubCard
                    key={t.slug}
                    tool={t}
                    media={section.kind === "media"}
                  />
                ))}
              </ul>
            )}
        </section>
      ))}

      <details data-hub-archive class="mt-12 border-t border-rule pt-4">
        <summary class="cursor-pointer text-parchment">
          Archived ({archived.length})
        </summary>
        <ul class="mt-2">
          {archived.map((t) => (
            <ToolHubLine key={t.slug} tool={t} text={`${t.job}.`}>
              {t.live && (
                <a
                  href={t.live.href}
                  {...linkEvent(t.live.href, { item: t.slug })}
                  class={`mt-1 inline-block text-sm ${FACT_LINK}`}
                >
                  {t.live.label}
                </a>
              )}
            </ToolHubLine>
          ))}
        </ul>
      </details>
    </>
  );
}
