import { Card } from "@spy4x/preact-ui/card";
import { FeatureCard } from "@spy4x/preact-ui/feature-card";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { WindowFrame } from "@spy4x/preact-ui/window-frame";
import { IconArrowRight, IconCheck } from "@spy4x/preact-icons";
import Button from "./Button.tsx";
import CopyCommand from "../islands/CopyCommand.tsx";
import type { ToolScreenshot } from "../lib/tools.ts";
import type { Tool } from "../lib/tools.ts";
import { eventAttrs } from "../lib/analytics.ts";
import { FACT_LINK } from "./FactCard.tsx";

/**
 * The showcase blocks of a tool page whose entry has a `headline` (#448):
 * the hero beside its screenshot, "What you get" and "Where it stands".
 * `routes/tools/[slug].tsx` renders them instead of its plain header; a
 * tool without a `headline` never reaches this file.
 */

/** One screenshot as an `<img>`: lazy unless it is the page's hero. */
function Shot(
  { shot, sizes, hero = false }: {
    shot: ToolScreenshot;
    sizes: string;
    hero?: boolean;
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
      class="block w-full h-auto"
    />
  );
}

/**
 * The first screen: the name, job and status on one line, the headline as
 * the page's `<h1>`, the lede, the demo button with the repository beside
 * it, the quick-start command, and the hero shot in a browser frame (to the
 * right from 1024px, under the text on a phone).
 */
export function ShowcaseHero({ tool, repo }: { tool: Tool; repo?: string }) {
  const toolLink = (to: string) =>
    eventAttrs("outbound", { to, item: tool.slug });
  return (
    <header
      data-tool-hero
      class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center"
    >
      <div class="min-w-0">
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
        {tool.quickStart && (
          <div data-quick-start class="mt-8">
            <p id={`quick-start-${tool.slug}`} class="text-sm text-graphite">
              {tool.quickStart.label}
            </p>
            <div
              role="group"
              aria-labelledby={`quick-start-${tool.slug}`}
              class="mt-2 flex items-start gap-3 rounded-lg border border-rule bg-paper py-2 pl-3 pr-2"
            >
              <code class="min-w-0 flex-1 self-center text-sm text-parchment whitespace-pre-wrap break-words">
                {tool.quickStart.command}
              </code>
              <CopyCommand
                text={tool.quickStart.command}
                analytics={eventAttrs("tool-install-copy", { item: tool.slug })}
              />
            </div>
          </div>
        )}
      </div>
      {tool.hero && (
        <WindowFrame
          variant="browser"
          title={tool.live ? new URL(tool.live.href).host : undefined}
          class="min-w-0"
        >
          <Shot
            shot={tool.hero}
            hero
            sizes="(min-width: 1024px) 33rem, calc(100vw - 2rem)"
          />
        </WindowFrame>
      )}
    </header>
  );
}

/**
 * "What you get": one library `FeatureCard` per feature, three columns from
 * 1024px (two from 640px), a `wide` card spanning two. Cards differ in
 * height, so each row aligns them to the start.
 */
export function ShowcaseFeatures({ tool }: { tool: Tool }) {
  if (!tool.features?.length) return null;
  return (
    <section aria-labelledby="features" class="mt-16">
      <h2 id="features" class="text-2xl sm:text-3xl text-parchment">
        What you get
      </h2>
      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {tool.features.map((f, i) => (
          <FeatureCard
            key={f.title}
            id={`feature-${i + 1}`}
            title={f.title}
            wide={f.wide}
            media={f.shot && (
              <Shot
                shot={f.shot}
                sizes={f.wide
                  ? "(min-width: 1024px) 42rem, (min-width: 640px) 50vw, 100vw"
                  : "(min-width: 1024px) 21rem, (min-width: 640px) 50vw, 100vw"}
              />
            )}
          >
            {f.text}
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}

/**
 * "Where it stands": what works today beside what is not built yet. The
 * second card always links the repository's open issues, which is where
 * the project itself keeps that list.
 */
export function ShowcaseStanding(
  { tool, repo }: { tool: Tool; repo?: string },
) {
  if (!tool.works?.length) return null;
  const notYet = tool.notYet ?? [];
  return (
    <section aria-labelledby="standing" class="mt-16">
      <h2 id="standing" class="text-2xl sm:text-3xl text-parchment">
        Where it stands
      </h2>
      <div class="mt-6 grid gap-5 md:grid-cols-2 items-start">
        <Card data-works class="p-6">
          <h3 class="text-lg text-parchment">Works today</h3>
          <ul class="mt-4 space-y-2">
            {tool.works.map((w) => (
              <li key={w} class="flex gap-3 text-parchment">
                <IconCheck
                  class="mt-1 size-4 shrink-0 text-sage"
                  aria-hidden="true"
                />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card data-not-yet class="p-6">
          <h3 class="text-lg text-parchment">Not built yet</h3>
          {notYet.length > 0 && (
            <ul class="mt-4 space-y-2 list-disc pl-5 text-graphite">
              {notYet.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          {repo && (
            <p class="mt-4 text-graphite">
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
      </div>
    </section>
  );
}
