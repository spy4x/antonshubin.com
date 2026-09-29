import type { ComponentChildren } from "preact";

/** Link style shared by the fact cards' rows. */
export const FACT_LINK =
  "text-parchment underline underline-offset-4 hover:text-accent";

/** One `<dt>`/`<dd>` pair of a fact card, wrapped in a `<div>` as `<dl>` allows. */
export function Fact(
  { term, children, ...rest }: {
    term: string;
    children: ComponentChildren;
    "data-project-period"?: boolean;
  },
) {
  return (
    <div class="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3" {...rest}>
      <dt class="text-graphite">{term}</dt>
      <dd class="text-parchment min-w-0">{children}</dd>
    </div>
  );
}

/**
 * The shell of a fact card (#246, #269): the `<aside>` box on Paper that
 * holds a `<dl>` of `Fact` rows and the actions under it. The project page's
 * card (`components/ProjectFactCard.tsx`) and the home page's card
 * (`routes/index.tsx`) both render inside it, so the box is styled in one
 * place. Extra attributes (a `data-*` marker) go on the `<aside>`.
 */
export function FactCard(
  { label, children, ...rest }: {
    /** The landmark's accessible name, e.g. "Project facts". */
    label: string;
    children: ComponentChildren;
    "data-project-facts"?: boolean;
    "data-home-facts"?: boolean;
  },
) {
  return (
    <aside
      aria-label={label}
      class="bg-paper border border-rule rounded-xl p-5"
      {...rest}
    >
      {children}
    </aside>
  );
}
