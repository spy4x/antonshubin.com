import type { ComponentChildren } from "preact";
import { Breadcrumb } from "../Breadcrumb.tsx";
import { Layout } from "../Layout.tsx";
import { SEOHead } from "../SEOHead.tsx";
import ToolZoom from "../../islands/ToolZoom.tsx";
import { getBreadcrumb } from "../../lib/head.ts";
import { setToolHead, type ToolPageData } from "./tool-page.ts";
import { ToolJsonLd } from "./ToolJsonLd.tsx";
import { ToolHero, type ToolHeroProps } from "./ToolHero.tsx";
import { ToolDetails } from "./ToolDetails.tsx";
import { ToolBand, type ToolBandProps } from "./ToolBand.tsx";
import { ToolMore } from "./ToolMore.tsx";

/** Props of {@link ToolFrame}: the page's data, its own middle, and what it changes in the frame. */
export interface ToolFrameProps {
  data: ToolPageData;
  /** `ctx.url.pathname`, for the nav's current item. */
  currentPath: string;
  /** The hero's options (`ToolHeroProps` without `data`); its `children` is the line under the actions. */
  hero?: Omit<ToolHeroProps, "data">;
  /** Beside the facts card; defaults to "Where it stands" from `works`. `null` for none. */
  beside?: ComponentChildren;
  /** The band's options (`ToolBandProps` without `data`). */
  band?: Omit<ToolBandProps, "data">;
  /** The three tools "More tools" shows, by slug. */
  more?: string[];
  /** Part 4, the page's own middle: free, within the `@theme` tokens and the library. */
  children?: ComponentChildren;
}

/**
 * The shared frame of every `/tools/<slug>` page (#454): the head, the
 * JSON-LD, the "‹ Tools" back link, the hero (parts 2–3), the page's own
 * middle (part 4, `children`), the facts card with the fit lists and the
 * story (part 5), the "Two ways to use it" band with the body's only Book
 * (part 6) and "More tools" (part 7), plus the page's one `ToolZoom`
 * lightbox. A custom page (`routes/tools/<slug>.tsx`) renders this with its
 * middle; `routes/tools/[slug].tsx` renders it for every other tool.
 */
export function ToolFrame(
  { data, currentPath, hero, beside, band, more, children }: ToolFrameProps,
) {
  setToolHead(data);
  return (
    <Layout currentPath={currentPath}>
      <SEOHead />
      <ToolJsonLd data={data} />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb items={getBreadcrumb(data.canonical, data.tool.name)} />
        {
          /* One lightbox box around every screenshot on the page: the
          library's ZoomableImages wires only the first [data-lightbox]. */
        }
        <div data-lightbox>
          <ToolHero data={data} {...hero} />
          {children && (
            <div data-tool-middle class="mt-16 space-y-16">{children}</div>
          )}
        </div>
        <ToolDetails data={data} beside={beside} />
        <ToolBand data={data} {...band} />
        <ToolMore data={data} picks={more} />
      </div>
      <ToolZoom item={data.tool.slug} />
    </Layout>
  );
}
