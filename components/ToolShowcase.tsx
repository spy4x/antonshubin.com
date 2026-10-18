import { type ComponentChildren, Fragment } from "preact";
import { Card } from "@spy4x/preact-ui/card";
import { FeatureCard } from "@spy4x/preact-ui/feature-card";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { WindowFrame } from "@spy4x/preact-ui/window-frame";
import { IconArrowRight, IconCheck } from "@spy4x/preact-icons";
import Button from "./Button.tsx";
import CopyButton from "../islands/CopyButton.tsx";
import type { Tool, ToolFeature, ToolScreenshot } from "../lib/tools.ts";
import { eventAttrs } from "../lib/analytics.ts";
import { FACT_LINK } from "./FactCard.tsx";

/**
 * The showcase blocks of a tool page whose entry has a `headline` (#448):
 * the hero beside its screenshot, "What you get", and "Where it stands" with
 * the fit lists, the story and the fact card. `routes/tools/[slug].tsx`
 * renders them instead of its plain layout; a tool without a `headline`
 * never reaches this file.
 */

/** One screenshot as an `<img>`: lazy unless it is the page's hero. */
function Shot(
  { shot, sizes, hero = false, class: className = "block" }: {
    shot: ToolScreenshot;
    sizes: string;
    hero?: boolean;
    class?: string;
  },
) {
  return (
    <img
      src={shot.src}
      srcset={shot.srcset}
      sizes={shot.srcset ? sizes : undefined}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading={hero ? "eager" : "lazy"}
      decoding={hero ? undefined : "async"}
      fetchpriority={hero ? "high" : undefined}
      class={`${className} w-full h-auto`}
    />
  );
}

/**
 * The first screen. On a phone: the name line, the headline, the lede, the
 * actions, the hero shot, then the quick start, so the product shows on the
 * first screen. From 1024px the text and the quick start share the left
 * column and the shot sits on the right.
 */
export function ShowcaseHero({ tool, repo }: { tool: Tool; repo?: string }) {
  const toolLink = (to: string) =>
    eventAttrs("outbound", { to, item: tool.slug });
  const commandId = `quick-start-${tool.slug}`;
  return (
    <header
      data-tool-hero
      class="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center"
    >
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">
        <p
          data-tool-eyebrow
          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-graphite"
        >
          <span class="font-semibold text-parchment">{tool.name}</span>
          <span aria-hidden="true">·</span>
          <span>{tool.job}</span>
          <span aria-hidden="true">·</span>
          <StatusMark status={tool.status} />
        </p>
        <h1 class="mt-3 text-3xl sm:text-5xl text-parchment text-balance leading-tight">
          {tool.headline}
        </h1>
        {tool.lede && (
          <p class="mt-5 text-parchment text-base sm:text-lg leading-relaxed">
            {tool.lede}
          </p>
        )}
        <div class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
          {tool.live && (
            <Button
              href={tool.live.href}
              {...toolLink("live")}
              class="gap-2 px-5 py-3 text-base"
            >
              {tool.live.label}
              <IconArrowRight class="size-4" />
            </Button>
          )}
          {repo && (
            <a href={repo} {...toolLink("github")} class={FACT_LINK}>
              View on GitHub
            </a>
          )}
        </div>
      </div>
      {tool.hero && (
        <WindowFrame
          variant="browser"
          title={tool.live ? new URL(tool.live.href).host : undefined}
          class="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          <Shot
            shot={tool.hero}
            hero
            sizes="(min-width: 1024px) 33rem, calc(100vw - 2rem)"
          />
        </WindowFrame>
      )}
      {tool.quickStart && (
        <div
          data-quick-start
          class="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          <p id={`${commandId}-label`} class="text-sm text-graphite">
            {tool.quickStart.label}
          </p>
          <div
            role="group"
            aria-labelledby={`${commandId}-label`}
            class="mt-2 flex items-center gap-3 rounded-lg border border-rule bg-paper py-2.5 pl-3 pr-3"
          >
            {
              /* Each argument is one unbreakable box, so a narrow screen wraps
                the command between arguments, never inside one. */
            }
            <code
              id={commandId}
              class="min-w-0 flex-1 text-sm text-parchment"
            >
              {tool.quickStart.command.split(" ").map((arg, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span class="inline-block whitespace-nowrap">{arg}</span>
                </Fragment>
              ))}
            </code>
            <CopyButton
              elementId={commandId}
              label="Copy"
              title={`Copy the command to start a product from ${tool.name}`}
              analytics={eventAttrs("tool-install-copy", { item: tool.slug })}
            />
          </div>
        </div>
      )}
    </header>
  );
}

/** The `lg` column span of each feature card size in the six-column grid. */
const SPAN: Record<NonNullable<ToolFeature["size"]> | "third", string> = {
  third: "lg:col-span-2",
  half: "lg:col-span-3",
  wide: "lg:col-span-4",
};

/** The `sizes` of a card's shot at each card size. */
const SIZES: Record<keyof typeof SPAN, string> = {
  third: "(min-width: 1024px) 20.5rem, (min-width: 640px) 50vw, 100vw",
  half: "(min-width: 1024px) 31.5rem, (min-width: 640px) 50vw, 100vw",
  wide: "(min-width: 1024px) 42rem, (min-width: 640px) 50vw, 100vw",
};

/** A feature's picture: its `phoneShot` under 640px when it has one. */
function FeatureMedia({ feature }: { feature: ToolFeature }) {
  const { shot, phoneShot } = feature;
  if (!shot) return null;
  const sizes = SIZES[feature.size ?? "third"];
  if (!phoneShot) return <Shot shot={shot} sizes={sizes} />;
  // Two images, one shown per width: each keeps its own alt text, and the
  // hidden one is never fetched because a lazy image loads only when shown.
  return (
    <>
      <Shot shot={phoneShot} sizes="100vw" class="block sm:hidden" />
      <Shot shot={shot} sizes={sizes} class="hidden sm:block" />
    </>
  );
}

/**
 * "What you get": one library `FeatureCard` per feature in a six-column
 * grid from 1024px (a third, a half or two thirds each), two columns from
 * 640px. Cards in a row stretch to one height and each shot sits at its
 * card's bottom, so a row has no holes.
 */
export function ShowcaseFeatures({ tool }: { tool: Tool }) {
  if (!tool.features?.length) return null;
  return (
    <section aria-labelledby="features" class="mt-16">
      <h2 id="features" class="text-2xl sm:text-3xl text-parchment">
        What you get
      </h2>
      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {tool.features.map((f, i) => (
          <FeatureCard
            key={f.title}
            id={`feature-${i + 1}`}
            title={f.title}
            class={SPAN[f.size ?? "third"]}
            media={f.shot && <FeatureMedia feature={f} />}
          >
            {f.text}
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}

/**
 * "Where it stands" and what follows it. From 1024px: one card with what
 * works today and a footer line to the open issues, beside the fact card;
 * under both, "Use it if", "Skip it if" and the story in three columns. On a
 * phone the fact card comes last.
 */
export function ShowcaseDetails(
  { tool, repo, facts, story }: {
    tool: Tool;
    repo?: string;
    /** The fact card, as the plain layout draws it. */
    facts: ComponentChildren;
    /** "The story behind it", or nothing. */
    story?: ComponentChildren;
  },
) {
  const notYet = tool.notYet ?? [];
  return (
    <div class="mt-16 grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {(tool.works?.length ?? 0) > 0 && (
        <section
          aria-labelledby="standing"
          class="min-w-0 lg:col-start-1 lg:row-start-1"
        >
          <h2 id="standing" class="text-2xl sm:text-3xl text-parchment">
            Where it stands
          </h2>
          <Card data-works class="mt-6">
            <div class="p-6">
              <h3 class="text-lg text-parchment">Works today</h3>
              <ul class="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {tool.works!.map((w) => (
                  <li key={w} class="flex gap-3 text-parchment">
                    <IconCheck
                      class="mt-1 size-4 shrink-0 text-sage"
                      aria-hidden="true"
                    />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              {notYet.length > 0 && (
                <>
                  <h3 class="mt-6 text-lg text-parchment">Not built yet</h3>
                  <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                    {notYet.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </>
              )}
            </div>
            {repo && (
              <p
                data-not-yet
                class="border-t border-rule px-6 py-4 text-graphite"
              >
                {notYet.length > 0 ? "The rest" : "What is not built yet"}{" "}
                is on the{" "}
                <a
                  href={`${repo}/issues`}
                  {...eventAttrs("outbound", { to: "github", item: tool.slug })}
                  class={FACT_LINK}
                >
                  open issues
                </a>.
              </p>
            )}
          </Card>
        </section>
      )}

      <div
        data-showcase-more
        class="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:col-span-2"
      >
        {(tool.useIf?.length ?? 0) > 0 && (
          <section aria-labelledby="fit">
            <h2 id="fit" class="text-xl text-parchment">Use it if</h2>
            <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
              {tool.useIf!.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        )}
        {(tool.dontUseIf?.length ?? 0) > 0 && (
          <section aria-labelledby="skip">
            <h2 id="skip" class="text-xl text-parchment">Skip it if</h2>
            <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
              {tool.dontUseIf!.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        )}
        {story && <div class="sm:col-span-2 lg:col-span-1">{story}</div>}
      </div>

      <div
        data-fact-card
        class="lg:col-start-2 lg:row-start-1"
      >
        {facts}
      </div>
    </div>
  );
}
