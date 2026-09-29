import { type PromiseItem, promises } from "../lib/promises.ts";
import { ArrowRightIcon } from "./Icons.tsx";

/** A quiet link under one promise of the `full` timeline: a catalog item or a page. */
export interface PromiseLink {
  href: string;
  label: string;
  /** The Umami event the click records. */
  event: string;
}

/**
 * The five promises as a timeline, in the order a project meets them
 * (`lib/promises.ts`): the `when` label as plain text, the title as a heading
 * of `headingLevel`, the `desc`, and in the `full` variant the `why`. One
 * `<li id={promise.id}>` per promise, so a page can link `/how-i-work#<id>`.
 *
 * `compact` (the home page, #269) links each step to
 * `/how-i-work#<id>`. `full` (how-i-work, #275) shows the reason too, with the
 * `desc` in Parchment above the Graphite `why`, and adds the quiet link
 * `links` holds for that promise, if any. Both are vertical below 1024px,
 * with the rail down the left; from 1024px they are five columns with the
 * rail as a horizontal top rule, unless `layout="stack"` keeps them vertical
 * at every width (the how-i-work page, whose column is too narrow for five).
 * A small marker sits on the rail. There are no icons and no accent colour.
 * Every step has `scroll-mt-8`, so a `#<id>` link doesn't land under the top
 * edge.
 */
export function PromiseTimeline(
  {
    variant,
    headingLevel,
    items = promises,
    umamiPrefix,
    layout = "row",
    links = {},
  }: {
    variant: "full" | "compact";
    headingLevel: 2 | 3;
    items?: PromiseItem[];
    /** `row` (default): five columns from 1024px. `stack`: vertical at every width. */
    layout?: "row" | "stack";
    /** `full` only: one quiet link under a promise, keyed by promise id. */
    links?: Record<string, PromiseLink>;
    /** When set, each compact step link carries `data-umami-event="<prefix><id>"`. */
    umamiPrefix?: string;
  },
) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <ol
      data-promise-timeline={variant}
      data-promise-layout={layout}
      class={layout === "row"
        ? "grid gap-8 lg:grid-cols-5 lg:gap-6"
        : "grid gap-8"}
    >
      {items.map((p) => {
        const body = (
          <>
            <p class="text-sm text-graphite">{p.when}</p>
            <Heading class="mt-1 text-lg text-parchment leading-snug">
              {p.title}
            </Heading>
            <p
              class={`mt-2 text-sm leading-relaxed ${
                variant === "full" ? "text-parchment" : "text-graphite"
              }`}
            >
              {p.desc}
            </p>
            {variant === "full" && (
              <p class="mt-2 text-sm text-graphite leading-relaxed">{p.why}</p>
            )}
            {variant === "full" && links[p.id] && (
              <a
                href={links[p.id].href}
                data-umami-event={links[p.id].event}
                class="mt-2 inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 hover:text-accent"
              >
                {links[p.id].label}
                <ArrowRightIcon class="w-3.5 h-3.5" />
              </a>
            )}
          </>
        );
        return (
          <li
            key={p.id}
            id={p.id}
            class={`relative scroll-mt-8 border-l-2 border-rule-strong pl-6 ${
              layout === "row"
                ? "lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6"
                : ""
            }`}
          >
            <span
              aria-hidden="true"
              class={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-rule-strong bg-ink ${
                layout === "row" ? "lg:left-0 lg:-top-[7px]" : ""
              }`}
            />
            {variant === "compact"
              ? (
                <a
                  href={`/how-i-work#${p.id}`}
                  data-umami-event={umamiPrefix
                    ? `${umamiPrefix}${p.id}`
                    : undefined}
                  class="block hover:text-parchment"
                >
                  {body}
                </a>
              )
              : body}
          </li>
        );
      })}
    </ol>
  );
}
