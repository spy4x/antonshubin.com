import { cn } from "@spy4x/preact-cn";
import { firstSentence } from "../lib/llms.ts";
import {
  liveRepo,
  type ToolsLive,
  withLiveVersion,
} from "../lib/tools-live.ts";
import { ciUrl, type Tool, toolLicence, type ToolRow } from "../lib/tools.ts";
import { CiPill } from "./CiPill.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { eventAttrs, linkEvent } from "../lib/analytics.ts";

const linkClass = "text-accent underline underline-offset-4";

/** The version line of a card: "1.3.0 on JSR", or the honest "publishing" wording. */
function versionText(tool: Tool): string | null {
  const r = tool.registry;
  if (!r) return null;
  return r.published
    ? `${r.version} on ${r.name}`
    : `Publishing ${r.version} to ${r.name}`;
}

/** True when the summary's first sentence only says the job line again. */
function repeatsJob(tool: Tool): boolean {
  return firstSentence(tool.summary).toLowerCase().startsWith(
    tool.job.toLowerCase(),
  );
}

/** The Eirene credit, shown wherever a tool that carries one is listed. */
function Credit({ tool }: { tool: Tool }) {
  if (!tool.credit) return null;
  return (
    <p data-credit class="relative z-10 mt-2 text-sm text-parchment">
      {tool.credit.text} {tool.credit.links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && " · "}
          <a href={l.href} class={linkClass}>{l.label}</a>
        </span>
      ))}
    </p>
  );
}

/**
 * One tool on the hub or under "More tools": name linking its page, the job
 * line, status, version and CI. `variant` sets the weight: `card` for the
 * Tools group, `wide` for a product with its first summary sentence,
 * `compact` for one line of a paused or archived project, `more` for the
 * strip at the foot of a tool page. Never shows an install command: that
 * lives on the tool's page. The name's link is stretched over the card or row
 * (#336); the credit's links and the CI pill sit above it.
 */
export function ToolCard(
  { tool, live, variant }: {
    tool: Tool;
    live: ToolsLive;
    variant: "card" | "wide" | "compact" | "more";
  },
) {
  const snap = liveRepo(tool, live);
  const version = variant === "compact" || variant === "more"
    ? null
    : versionText(withLiveVersion(tool, live));
  const title = (
    <a
      href={`/tools/${tool.slug}`}
      {...eventAttrs("cta", { place: "body", target: `/tools/${tool.slug}` })}
      class="hover:text-accent underline-offset-4 hover:underline after:absolute after:inset-0 after:rounded-xl"
    >
      {tool.name}
    </a>
  );
  if (variant === "compact") {
    return (
      <li
        data-tool={tool.slug}
        class="relative py-3 border-t border-rule first:border-t-0 flex flex-wrap items-baseline gap-x-4 gap-y-1"
      >
        <span class="text-parchment">{title}</span>
        <span class="text-graphite">{tool.job}.</span>
        <StatusMark status={tool.status} />
      </li>
    );
  }
  return (
    <li
      data-tool={tool.slug}
      class={cn(
        "relative bg-paper border border-rule rounded-xl p-5 transition-colors hover:border-rule-strong focus-within:border-rule-strong",
        variant === "wide" && "sm:p-6",
      )}
    >
      <h3 class="text-xl text-parchment">{title}</h3>
      <p class="mt-1 text-graphite">{tool.job}.</p>
      {variant === "wide" && !repeatsJob(tool) && (
        <p class="mt-2 text-graphite text-sm">{firstSentence(tool.summary)}</p>
      )}
      <Credit tool={tool} />
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-graphite">
        <StatusMark status={tool.status} />
        {version && <span data-version>{version}</span>}
        {variant !== "more" && toolLicence(tool) && (
          <span>{toolLicence(tool)}</span>
        )}
        {variant !== "more" && tool.ci && snap && (
          <CiPill ci={snap.ci} pipelinesUrl={ciUrl(tool)!} />
        )}
      </div>
    </li>
  );
}

/** A hub entry with no page yet (oko, the Seed): name, status, note and links. */
export function ToolRowCard(
  { row, variant }: { row: ToolRow; variant: "card" | "wide" | "compact" },
) {
  if (variant === "compact") {
    return (
      <li
        data-tool={row.slug}
        class="py-3 border-t border-rule first:border-t-0 flex flex-wrap items-baseline gap-x-4 gap-y-1"
      >
        <span class="text-parchment">{row.name}</span>
        {row.note && <span class="text-graphite">{row.note}</span>}
        <StatusMark status={row.status} />
        {row.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            {...linkEvent(l.href, { item: row.slug })}
            class={linkClass}
          >
            {l.label}
          </a>
        ))}
      </li>
    );
  }
  return (
    <li
      data-tool={row.slug}
      class="bg-paper border border-rule rounded-xl p-5"
    >
      <h3 class="text-xl text-parchment">{row.name}</h3>
      {row.note && <p class="mt-1 text-graphite">{row.note}</p>}
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <StatusMark status={row.status} />
        {row.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            {...linkEvent(l.href, { item: row.slug })}
            class={linkClass}
          >
            {l.label}
          </a>
        ))}
      </div>
    </li>
  );
}
