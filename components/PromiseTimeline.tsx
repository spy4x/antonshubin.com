import { type PromiseItem, promises } from "../lib/promises.ts";

/**
 * The five promises as a timeline, in the order a project meets them
 * (`lib/promises.ts`): the `when` label as plain text, the title as a heading
 * of `headingLevel`, the `desc`, and in the `full` variant the `why`. One
 * `<li id={promise.id}>` per promise, so a page can link `/how-i-work#<id>`.
 *
 * `compact` (the home page, #269) links each step to
 * `/how-i-work#<id>`. `full` (how-i-work, #275) shows the reason too and
 * links nowhere. Both are vertical below 1024px, with the rail down the left;
 * from 1024px they are five columns with the rail as a horizontal top rule. A
 * small marker sits on the rail. There are no icons and no accent colour.
 */
export function PromiseTimeline(
  { variant, headingLevel, items = promises, umamiPrefix }: {
    variant: "full" | "compact";
    headingLevel: 2 | 3;
    items?: PromiseItem[];
    /** When set, each compact step link carries `data-umami-event="<prefix><id>"`. */
    umamiPrefix?: string;
  },
) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <ol
      data-promise-timeline={variant}
      class="grid gap-8 lg:grid-cols-5 lg:gap-6"
    >
      {items.map((p) => {
        const body = (
          <>
            <p class="text-sm text-graphite">{p.when}</p>
            <Heading class="mt-1 text-lg text-parchment leading-snug">
              {p.title}
            </Heading>
            <p class="mt-2 text-sm text-graphite leading-relaxed">{p.desc}</p>
            {variant === "full" && (
              <p class="mt-2 text-sm text-graphite leading-relaxed">{p.why}</p>
            )}
          </>
        );
        return (
          <li
            key={p.id}
            id={p.id}
            class="relative border-l-2 border-rule-strong pl-6 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6"
          >
            <span
              aria-hidden="true"
              class="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-rule-strong bg-ink lg:left-0 lg:-top-[7px]"
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
