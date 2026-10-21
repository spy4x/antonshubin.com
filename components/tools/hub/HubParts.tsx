import type { ComponentChildren } from "preact";
import { Card } from "@spy4x/preact-ui/card";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { IconArrowRight, IconArrowUpRight } from "@spy4x/preact-icons";
import Button from "../../Button.tsx";
import { FACT_LINK } from "../../FactCard.tsx";
import { InstallLine } from "../../InstallLine.tsx";
import { MediaFrame } from "../../tool-frame/ToolHeroMedia.tsx";
import { heroStill, toolLede } from "../../tool-frame/tool-page.ts";
import ToolHeroClip from "../../../islands/ToolHeroClip.tsx";
import { eventAttrs, type Place } from "../../../lib/analytics.ts";
import { firstSentence } from "../../../lib/llms.ts";
import {
  clipSources,
  repoUrl,
  type Tool,
  type ToolScreenshot,
} from "../../../lib/tools.ts";

/**
 * The smallest file a shot names (its `srcset`'s narrowest width, else its
 * `src`): a card's picture is at most about 22rem wide, and a poster under a
 * play mark or a screenshot the visitor opens on the tool page reads fine
 * at about 640px on any screen. Offering only that file keeps a 3x phone
 * from fetching the 1280px copies while the stylesheet still loads (#456).
 */
export function smallestFile(shot: ToolScreenshot): string {
  if (!shot.srcset) return shot.src;
  const candidates = shot.srcset.split(",").map((c) => {
    const [url, width] = c.trim().split(/\s+/);
    return { url, width: Number.parseInt(width, 10) };
  });
  return candidates.reduce((a, b) => (b.width < a.width ? b : a)).url;
}

/** The spotlight's clip: seven of twelve columns from 1024px. */
const SPOTLIGHT_SIZES = "(min-width: 1024px) 40rem, calc(100vw - 2rem)";

/** The host a frame's address bar shows: the clip's own title, else the live link's host. */
function frameTitle(tool: Tool): string | undefined {
  if (tool.clip?.frameTitle) return tool.clip.frameTitle;
  const href = tool.live?.href;
  if (!href) return undefined;
  return href.startsWith("http")
    ? new URL(href).host
    : `antonshubin.com${href}`;
}

/** The tool's name, linking its page: the card's first link. */
function NameLink({ tool, place }: { tool: Tool; place: Place }) {
  return (
    <a
      href={`/tools/${tool.slug}`}
      {...eventAttrs("cta", { place, target: `/tools/${tool.slug}` })}
      class={FACT_LINK}
    >
      {tool.name}
    </a>
  );
}

/**
 * A card's picture, at one shape in every card of a row (16:10): the clip
 * (looping once pressed, lazy, nothing fetched before the press), else its
 * poster as a still, else the hero shot or first screenshot, each from its
 * smallest file. A 16:9 terminal clip sits centred on Ink rather than cropped.
 * Null for a tool with no picture yet; its card is then text only.
 */
function CardMedia({ tool }: { tool: Tool }) {
  const clip = tool.clip;
  const still = heroStill(tool);
  if (!still) return null;
  const variant = clip?.frame ?? "browser";
  const picture = clip?.video
    ? (
      <div class="w-full">
        <ToolHeroClip
          item={tool.slug}
          place="card"
          loop
          title={clip.title}
          sources={clipSources(tool.slug)}
          poster={{
            src: smallestFile(clip.poster),
            width: clip.poster.width,
            height: clip.poster.height,
          }}
        />
      </div>
    )
    : <Still shot={still} />;
  return (
    <MediaFrame
      variant={variant}
      title={variant === "browser" ? frameTitle(tool) : undefined}
    >
      <div
        data-hub-media
        class="flex aspect-[16/10] w-full items-center overflow-hidden bg-ink"
      >
        {picture}
      </div>
    </MediaFrame>
  );
}

/**
 * A lazy, low-priority still from the shot's smallest file, top-aligned when
 * the shape crops it. It only shows: the tool's page has the full size.
 */
function Still({ shot }: { shot: ToolScreenshot }) {
  return (
    <img
      src={smallestFile(shot)}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading="lazy"
      fetchpriority="low"
      decoding="async"
      class="block h-full w-full object-cover object-top"
    />
  );
}

/**
 * The one action of a card: the live link, else the install line with Copy,
 * else "View on GitHub". Nothing for a tool with none of the three.
 */
function CardAction({ tool }: { tool: Tool }) {
  if (tool.live) {
    const external = tool.live.href.startsWith("http");
    return (
      <a
        href={tool.live.href}
        {...eventAttrs("outbound", {
          to: "live",
          item: tool.slug,
          place: "card",
        })}
        class={`inline-flex items-center gap-1 ${FACT_LINK}`}
      >
        {tool.live.label}
        {external
          ? <IconArrowUpRight class="size-4 shrink-0" />
          : <IconArrowRight class="size-4 shrink-0" />}
      </a>
    );
  }
  if (tool.registry) {
    return <InstallLine tool={tool} id={`install-${tool.slug}`} />;
  }
  const repo = repoUrl(tool);
  if (!repo) return null;
  return (
    <a
      href={repo}
      {...eventAttrs("outbound", {
        to: "github",
        item: tool.slug,
        place: "card",
      })}
      class={FACT_LINK}
    >
      View on GitHub
    </a>
  );
}

/** The Eirene credit, under the preact-components card's action. */
function Credit({ tool }: { tool: Tool }) {
  if (!tool.credit) return null;
  return (
    <p data-credit class="text-sm text-graphite">
      {tool.credit.text} {tool.credit.links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && " · "}
          <a href={l.href} class={FACT_LINK}>{l.label}</a>
        </span>
      ))}
    </p>
  );
}

/** "name · status" over the job line: how every card opens. */
function TopLine({ tool }: { tool: Tool }) {
  return (
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3 class="text-xl text-parchment">
        <NameLink tool={tool} place="card" />
      </h3>
      <StatusMark status={tool.status} />
    </div>
  );
}

/**
 * One tool as a card (#456): the picture on top (`media` cards only), then
 * the name linking its page and the status, the job, an optional one-line
 * proof from `usedFor`, and one action. Not one big link: the play button is
 * its own control, so the name and the action are the card's two links.
 */
export function ToolHubCard(
  { tool, media }: { tool: Tool; media: boolean },
) {
  const proof = tool.usedFor && firstSentence(tool.usedFor);
  return (
    <li data-tool={tool.slug} class="flex">
      <Card class="flex w-full flex-col gap-4 p-4 sm:p-5">
        {media && <CardMedia tool={tool} />}
        <div class="flex flex-1 flex-col gap-2">
          <TopLine tool={tool} />
          <p class="text-graphite leading-relaxed">{capitalise(tool.job)}.</p>
          {proof && <p class="text-sm text-parchment">{proof}</p>}
        </div>
        <div class="flex flex-col gap-2 text-sm">
          <CardAction tool={tool} />
          <Credit tool={tool} />
        </div>
      </Card>
    </li>
  );
}

/** A "Being built" or archive line: name, status and one sentence, no card. */
export function ToolHubLine(
  { tool, text, children }: {
    tool: Tool;
    text: string;
    children?: ComponentChildren;
  },
) {
  return (
    <li
      data-tool={tool.slug}
      class="grid gap-x-6 gap-y-1 border-t border-rule py-4 first:border-t-0 sm:grid-cols-[14rem_minmax(0,1fr)]"
    >
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-parchment">
        <NameLink tool={tool} place="body" />
        <StatusMark status={tool.status} />
      </p>
      <div class="text-graphite leading-relaxed">
        <p>{capitalise(text)}</p>
        {children}
      </div>
    </li>
  );
}

/**
 * The spotlight that opens the hub: the launched tool's top line, its
 * headline as an `<h2>`, its clip (the page's one eager image), its lede,
 * "See <name>" and its live link. On a phone the clip comes right after the
 * heading, so the moving picture is on the first screen.
 */
export function Spotlight({ tool }: { tool: Tool }) {
  const clip = tool.clip;
  return (
    <section
      aria-labelledby="spotlight"
      data-tool={tool.slug}
      data-hub-spotlight
      class="mt-10 grid gap-6 rounded-xl border border-rule bg-desk p-5 sm:p-8 lg:grid-cols-12 lg:gap-x-10 lg:items-center"
    >
      <div class="min-w-0 lg:col-span-5 lg:row-start-1 lg:self-end">
        <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-graphite">
          <span class="font-semibold text-parchment">{tool.name}</span>
          <span aria-hidden="true">·</span>
          <span>{tool.job}</span>
          <span aria-hidden="true">·</span>
          <StatusMark status={tool.status} />
        </p>
        <h2
          id="spotlight"
          class="mt-3 text-2xl sm:text-3xl text-parchment text-balance leading-tight"
        >
          {tool.headline ?? `${tool.name}: ${tool.job}`}
        </h2>
      </div>
      {clip?.video && (
        <div class="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <MediaFrame variant={clip.frame} title={clip.frameTitle}>
            <ToolHeroClip
              item={tool.slug}
              place="hero"
              eager
              loop
              title={clip.title}
              sources={clipSources(tool.slug)}
              poster={{
                src: clip.poster.src,
                srcset: clip.poster.srcset,
                sizes: clip.poster.srcset ? SPOTLIGHT_SIZES : undefined,
                width: clip.poster.width,
                height: clip.poster.height,
              }}
            />
          </MediaFrame>
        </div>
      )}
      <div class="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-start">
        <p class="text-parchment leading-relaxed">{toolLede(tool)}</p>
        <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button
            href={`/tools/${tool.slug}`}
            {...eventAttrs("cta", {
              place: "hero",
              target: `/tools/${tool.slug}`,
            })}
            class="gap-2 px-5 py-3 text-base"
          >
            See {tool.name}
            <IconArrowRight class="size-4" />
          </Button>
          {tool.live && (
            <a
              href={tool.live.href}
              {...eventAttrs("outbound", {
                to: "live",
                item: tool.slug,
                place: "hero",
              })}
              class={`inline-flex items-center gap-1 ${FACT_LINK}`}
            >
              {tool.live.label}
              <IconArrowUpRight class="size-4 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/** "tiny self-hosted …" → "Tiny self-hosted …": a job line read as a sentence. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
