import type { ComponentChildren } from "preact";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { IconArrowRight } from "@spy4x/preact-icons";
import Button from "../Button.tsx";
import { FACT_LINK } from "../FactCard.tsx";
import { eventAttrs } from "../../lib/analytics.ts";
import type { ToolLink } from "../../lib/tools.ts";
import {
  heroStill,
  sameWords,
  toolLede,
  type ToolPageData,
} from "./tool-page.ts";
import { ToolHeroMedia } from "./ToolHeroMedia.tsx";

/** What a page may change in {@link ToolHero}; every field has the frame's default. */
export interface ToolHeroProps {
  data: ToolPageData;
  /**
   * The one secondary button for the live thing. Defaults to the entry's
   * `live`; `null` draws none. Never the accent: that is Book's alone.
   */
  action?: (ToolLink & { to?: string }) | null;
  /**
   * False leaves the `job` out of the top line, for a page whose headline
   * already says it; the header then carries `data-tool-job-hidden`. A job
   * that restates the headline word for word is left out on its own.
   * Defaults to true. A page without a headline shows no job there anyway.
   */
  showJob?: boolean;
  /**
   * The first media. Defaults to `ToolHeroMedia` (the clip, else the still);
   * a page's own media marks the header `data-tool-own-media`.
   */
  media?: ComponentChildren;
  /** A page-specific line under the actions, such as a quick start. */
  children?: ComponentChildren;
}

/**
 * Parts 2 and 3 of the tool frame (#454): the top line (name · job ·
 * `StatusMark` above a `headline`; the status alone when the `<h1>` is
 * "name: job"), the claim `<h1>`, the lede,
 * at most one secondary button and "View on GitHub", then the hero media.
 * On a phone the media follows the actions and the page's own line comes
 * last; from 1024px the media sits in the right column beside both.
 */
export function ToolHero(
  { data, action, showJob = true, media, children }: ToolHeroProps,
) {
  const { tool, repo } = data;
  const button: (ToolLink & { to?: string }) | null | undefined =
    action === undefined ? tool.live : action;
  const hasMedia = media === undefined
    ? Boolean(heroStill(tool))
    : media !== null && media !== false;
  const lede = toolLede(tool);
  // Without a headline the H1 already reads "name: job", so the top line
  // carries the status only and says neither again.
  const named = Boolean(tool.headline);
  // A job that only restates the headline is left out, like `showJob: false`.
  const jobShown = showJob && !sameWords(tool.job, tool.headline ?? "");
  const words = named && jobShown ? tool.job.split(" ") : [];
  const last = words.pop();
  return (
    <header
      data-tool-hero
      data-tool-job-hidden={jobShown ? undefined : ""}
      data-tool-own-media={media === undefined ? undefined : ""}
      class={hasMedia
        ? "grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center"
        : "grid gap-y-8 max-w-3xl"}
    >
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">
        <p
          data-tool-eyebrow
          class="text-sm text-graphite leading-relaxed"
        >
          {
            /* Inline, so a long job wraps like text; each separator stays with
            the item after it, and the status stays with the job's last word
            (one nowrap span), so it never wraps onto a line alone. */
          }
          {named && (
            <span class="font-semibold text-parchment">{tool.name}</span>
          )}
          {last !== undefined && (
            <>
              {" "}
              <span aria-hidden="true">·</span>{" "}
              <span data-tool-job>{words.map((w) => `${w} `).join("")}</span>
            </>
          )}
          <span class="whitespace-nowrap">
            {last}
            {named && " "}
            <span
              data-tool-status={tool.status}
              class="inline-flex items-center gap-2 align-middle"
            >
              {named && <span aria-hidden="true">·</span>}
              <StatusMark status={tool.status} />
            </span>
          </span>
        </p>
        <h1 class="mt-3 text-3xl sm:text-5xl text-parchment text-balance leading-tight">
          {tool.headline ?? `${tool.name}: ${tool.job}`}
        </h1>
        <p
          data-tool-lede
          class="mt-5 text-parchment text-base sm:text-lg leading-relaxed"
        >
          {lede}
        </p>
        <div class="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          {button && (
            <Button
              href={button.href}
              {...eventAttrs("outbound", {
                to: button.to ?? "live",
                item: tool.slug,
                place: "hero",
              })}
              class="w-full gap-2 px-5 py-3 text-base sm:w-auto"
            >
              {button.label}
              <IconArrowRight class="size-4" />
            </Button>
          )}
          {repo && (
            <a
              href={repo}
              {...eventAttrs("outbound", {
                to: "github",
                item: tool.slug,
                place: "hero",
              })}
              class={FACT_LINK}
            >
              View on GitHub
            </a>
          )}
        </div>
      </div>
      {hasMedia && (
        <div
          data-tool-media
          class="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          {media === undefined ? <ToolHeroMedia tool={tool} /> : media}
        </div>
      )}
      {children && (
        <div class="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start">
          {children}
        </div>
      )}
    </header>
  );
}
