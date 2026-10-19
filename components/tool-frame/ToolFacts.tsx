import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { CiPill } from "../CiPill.tsx";
import { Fact, FACT_LINK, FactCard } from "../FactCard.tsx";
import { eventAttrs } from "../../lib/analytics.ts";
import { MIN_STARS_SHOWN } from "../../lib/github-snapshot.ts";
import { ciUrl, toolLicence } from "../../lib/tools.ts";
import { checkedLabel } from "../../lib/tools-live.ts";
import type { ToolPageData } from "./tool-page.ts";

/**
 * The tool frame's facts card (#454, part 5): Status, Version, Licence, Runs
 * on, Website, Live, Code and CI, in that order, each row only when it has a
 * value. Its footer holds one link, "View on GitHub". Every link sends
 * `outbound` with `place: card`.
 */
export function ToolFacts({ data }: { data: ToolPageData }) {
  const { tool, live, snap, repo } = data;
  const licence = toolLicence(tool);
  const out = (to: string) =>
    eventAttrs("outbound", { to, item: tool.slug, place: "card" });
  return (
    <FactCard label="Tool facts">
      <h2 class="text-lg text-parchment mb-3">Facts</h2>
      <dl class="space-y-3 text-sm">
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
                <a
                  href={tool.registry.url}
                  {...out("registry")}
                  class={FACT_LINK}
                >
                  {tool.registry.name}
                </a>
              </>
            )}
          </Fact>
        )}
        {licence && <Fact term="Licence">{licence}</Fact>}
        {tool.runtime && <Fact term="Runs on">{tool.runtime}</Fact>}
        {tool.website && (
          <Fact term="Website">
            <a href={tool.website} {...out("website")} class={FACT_LINK}>
              {new URL(tool.website).host}
            </a>
          </Fact>
        )}
        {tool.live && (
          <Fact term="Live">
            <a href={tool.live.href} {...out("live")} class={FACT_LINK}>
              {tool.live.label}
            </a>
          </Fact>
        )}
        {tool.repo && (
          <Fact term="Code">
            {tool.repo}
            {snap && snap.stars >= MIN_STARS_SHOWN && (
              <span class="text-graphite">, {snap.stars} stars</span>
            )}
          </Fact>
        )}
        {tool.ci && snap && (
          <Fact term="CI">
            <CiPill ci={snap.ci} pipelinesUrl={ciUrl(tool)!} labelHidden />
            <span data-checked class="block mt-1 text-graphite">
              {checkedLabel(live, tool.repo)}.
            </span>
          </Fact>
        )}
      </dl>
      {repo && (
        <p class="mt-4 pt-4 border-t border-rule text-sm">
          <a href={repo} {...out("github")} class={FACT_LINK}>
            View on GitHub
          </a>
        </p>
      )}
    </FactCard>
  );
}
