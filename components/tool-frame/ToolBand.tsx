import { type ComponentChildren, Fragment } from "preact";
import { BookCallLink } from "../BookCallLink.tsx";
import { ClosingBand } from "../ClosingBand.tsx";
import { FACT_LINK } from "../FactCard.tsx";
import { InstallLine } from "../InstallLine.tsx";
import CopyButton from "../../islands/CopyButton.tsx";
import { eventAttrs } from "../../lib/analytics.ts";
import { catalogItem, catalogPath, priceLabel } from "../../lib/catalog.ts";
import { BOOK_LABEL } from "../../lib/nav.ts";
import { type Tool, toolLicence } from "../../lib/tools.ts";
import type { ToolPageData } from "./tool-page.ts";

/** The tooltip of every install and quick-start copy button on a tool page. */
export const COPY_INSTALL_TITLE = "Copy the install command";

/**
 * A tool's quick-start command with its copy button (`tool-install-copy`).
 * The command wraps only between arguments, never inside one. `id` must be
 * unique on the page: the copy button reads the command through it.
 */
export function QuickStart({ tool, id }: { tool: Tool; id: string }) {
  if (!tool.quickStart) return null;
  return (
    <div data-quick-start>
      <p id={`${id}-label`} class="text-sm text-graphite">
        {tool.quickStart.label}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        class="mt-2 flex items-center gap-3 rounded-lg border border-rule bg-paper py-2.5 pl-3 pr-3"
      >
        <code id={id} class="min-w-0 flex-1 text-sm text-parchment">
          {tool.quickStart.command.split(" ").map((arg, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span class="inline-block whitespace-nowrap">{arg}</span>
            </Fragment>
          ))}
        </code>
        <CopyButton
          elementId={id}
          label="Copy"
          title={COPY_INSTALL_TITLE}
          analytics={eventAttrs("tool-install-copy", { item: tool.slug })}
        />
      </div>
    </div>
  );
}

/** The "Use it yourself" sentence from the entry's own data: its state or its licence. */
function yourselfLine(tool: Tool): string {
  if (tool.status === "archived") {
    return "The repository is archived, kept for reference.";
  }
  const licence = toolLicence(tool);
  return licence
    ? `The code is on GitHub under the ${licence} licence.`
    : "The code is on GitHub.";
}

/** The label of the quiet link to a tool's catalog item. */
function offerLabel(slug: string): string {
  return slug === "zero-to-production-saas-mvp"
    ? "See the MVP offer"
    : `See the ${catalogItem(slug).shortTitle} offer`;
}

/** What a page may change in {@link ToolBand}. */
export interface ToolBandProps {
  data: ToolPageData;
  /** Replaces the "Use it yourself" column's body (its heading stays). */
  yourself?: ComponentChildren;
  /**
   * The "Have me build it" line for a tool without a `catalogSlug`.
   * Defaults to the hub's sentence.
   */
  buildLine?: string;
  /** Quiet links after the offer or "Services" link in "Have me build it". */
  buildLinks?: ComponentChildren;
}

/**
 * Part 6 of the tool frame (#454): the closing band "Two ways to use it", in
 * two columns from 640px. "Use it yourself": one sentence, the install or
 * quick-start command with its copy button, and "View on GitHub". "Have me
 * build it": the catalog item's short title, price and delivery, then Book
 * (the page body's only Book and only accent) and "See the MVP offer"; for
 * a tool with no catalog item, the hub's sentence, Book and "Services".
 */
export function ToolBand(
  { data, yourself, buildLine, buildLinks }: ToolBandProps,
) {
  const { tool, repo } = data;
  const catalog = tool.catalogSlug ? catalogItem(tool.catalogSlug) : null;
  const offerHref = catalog ? catalogPath(catalog.slug) : "/catalog";
  return (
    <ClosingBand
      heading="Two ways to use it"
      promiseIds={[]}
      book={false}
      bookItem={tool.slug}
    >
      <div data-tool-doors class="grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="use-yourself" data-tool-door="yourself">
          <h3 id="use-yourself" class="text-xl text-parchment">
            Use it yourself
          </h3>
          {yourself ?? (
            <div class="mt-2 space-y-4">
              <p class="text-graphite">{yourselfLine(tool)}</p>
              {tool.registry && (
                <InstallLine tool={tool} id={`band-install-${tool.slug}`} />
              )}
              <QuickStart tool={tool} id={`band-quick-start-${tool.slug}`} />
              {repo && (
                <p>
                  <a
                    href={repo}
                    {...eventAttrs("outbound", {
                      to: "github",
                      item: tool.slug,
                      place: "band",
                    })}
                    class={FACT_LINK}
                  >
                    View on GitHub
                  </a>
                </p>
              )}
            </div>
          )}
        </section>
        <section aria-labelledby="have-me-build" data-tool-door="build">
          <h3 id="have-me-build" class="text-xl text-parchment">
            Have me build it
          </h3>
          {catalog
            ? (
              <div data-tool-offer class="mt-2">
                <p class="font-semibold text-parchment">
                  {catalog.shortTitle}
                </p>
                <p class="mt-1 text-graphite">
                  <span class="price text-parchment">
                    {priceLabel(catalog)}
                  </span>
                  <span class="sr-only">,</span>
                  <span aria-hidden="true" class="mx-2">·</span>
                  {catalog.delivery}
                </p>
              </div>
            )
            : (
              <p class="mt-2 text-graphite">
                {buildLine ??
                  "Need something like this for your team? That's my day job."}
              </p>
            )}
          <div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
            <BookCallLink
              event={eventAttrs("book", { place: "band", item: tool.slug })}
              class="justify-center px-6 py-3"
            >
              {BOOK_LABEL}
            </BookCallLink>
            <a
              href={offerHref}
              {...eventAttrs("cta", { place: "band", target: offerHref })}
              class={FACT_LINK}
            >
              {catalog ? offerLabel(catalog.slug) : "Services"}
            </a>
            {buildLinks}
          </div>
        </section>
      </div>
    </ClosingBand>
  );
}
