import type { ComponentChildren } from "preact"
import { Card } from "@spy4x/preact-ui/card"
import { IconCheck } from "@spy4x/preact-icons"
import { StatusMark } from "@spy4x/preact-ui/status-mark"
import { FACT_LINK } from "../FactCard.tsx"
import { eventAttrs } from "../../lib/analytics.ts"
import type { ToolPageData } from "./tool-page.ts"
import { ToolFacts } from "./ToolFacts.tsx"

/**
 * "Where it stands" from the entry's `works`, `notYet` and `knownIssue`, with the open
 * issues linked under it (`outbound`, `to: issues`). Renders nothing for an
 * entry without `works`. {@link ToolDetails} draws it beside the facts card
 * unless the page passes its own `beside`.
 */
export function ToolStanding({ data }: { data: ToolPageData }) {
  const { tool, repo } = data
  if (!tool.works?.length) return null
  const notYet = tool.notYet ?? []
  return (
    <section aria-labelledby="standing">
      <h2 id="standing" class="text-2xl sm:text-3xl text-parchment">
        Where it stands
      </h2>
      <Card data-works class="mt-6">
        <div class="p-6">
          <h3 class="text-lg text-parchment">Works today</h3>
          <ul class="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
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
          {notYet.length > 0 && (
            <>
              <h3 class="mt-6 text-lg text-parchment">Not built yet</h3>
              <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
                {notYet.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </>
          )}
          {tool.knownIssue && (
            <p data-known-issue class="mt-6 text-graphite">
              <StatusMark status="known-issue" class="mr-2 text-parchment" />
              {tool.knownIssue.text}{" "}
              <a
                href={tool.knownIssue.link.href}
                {...eventAttrs("outbound", {
                  to: "issues",
                  item: tool.slug,
                  place: "body",
                })}
                class={FACT_LINK}
              >
                {tool.knownIssue.link.label}
              </a>
            </p>
          )}
        </div>
        {repo && (
          <p data-not-yet class="border-t border-rule px-6 py-4 text-graphite">
            {notYet.length > 0 ? "The rest" : "What is not built yet"} is on the
            {" "}
            <a
              href={`${repo}/issues`}
              {...eventAttrs("outbound", {
                to: "issues",
                item: tool.slug,
                place: "body",
              })}
              class={FACT_LINK}
            >
              open issues
            </a>.
          </p>
        )}
      </Card>
    </section>
  )
}

/** "Use it if" and "Skip it if", each only when the entry has lines for it. */
export function ToolFit({ data }: { data: ToolPageData }) {
  const { tool } = data
  return (
    <>
      {(tool.useIf?.length ?? 0) > 0 && (
        <section aria-labelledby="fit" data-tool-fit="use">
          <h2 id="fit" class="text-xl text-parchment">Use it if</h2>
          <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
            {tool.useIf!.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}
      {(tool.dontUseIf?.length ?? 0) > 0 && (
        <section aria-labelledby="skip" data-tool-fit="skip">
          <h2 id="skip" class="text-xl text-parchment">Skip it if</h2>
          <ul class="mt-3 space-y-2 list-disc pl-5 text-graphite">
            {tool.dontUseIf!.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}
    </>
  )
}

/** "The story behind it": each post as a card, with the entry's `storyLine` under its title. */
export function ToolStory({ data }: { data: ToolPageData }) {
  const { tool, posts } = data
  if (posts.length === 0) return null
  return (
    <section aria-labelledby="posts">
      <h2 id="posts" class="text-xl text-parchment">The story behind it</h2>
      <ul class="mt-3 space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Card data-story class="p-6">
              <a
                href={`/blog/${p.slug}`}
                {...eventAttrs("cta", {
                  place: "body",
                  target: `/blog/${p.slug}`,
                })}
                class="font-heading text-lg text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
              >
                {p.title}
              </a>
              {tool.storyLine && (
                <p class="mt-2 text-graphite">{tool.storyLine}</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Part 5 of the tool frame (#454). From 1024px: `beside` (by default
 * {@link ToolStanding}) on the left and the facts card in a 20rem column on
 * the right, sticky; under both, "Use it if", "Skip it if" and "The story
 * behind it" in three columns. With nothing beside the card, the fit lists
 * and the story take its left column instead. On a phone everything stacks
 * after the page's middle: `beside`, the facts card, then the fit lists.
 */
export function ToolDetails(
  { data, beside }: {
    data: ToolPageData
    /** The left column beside the facts card; `null` for none. */
    beside?: ComponentChildren
  },
) {
  const left = beside === undefined ? <ToolStanding data={data} /> : beside
  const hasLeft = left !== null && left !== false &&
    (beside !== undefined || Boolean(data.tool.works?.length))
  return (
    <div
      data-tool-details
      class="mt-16 grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
    >
      {hasLeft && (
        <div class="min-w-0 lg:col-start-1 lg:row-start-1">{left}</div>
      )}
      <div
        data-fact-card
        class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8"
      >
        <ToolFacts data={data} />
      </div>
      <div
        data-tool-fit-row
        class={hasLeft
          ? "min-w-0 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3"
          : "min-w-0 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-start-1 lg:row-start-1"}
      >
        <ToolFit data={data} />
        <ToolStory data={data} />
      </div>
    </div>
  )
}
