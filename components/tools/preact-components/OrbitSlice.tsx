import { Kpi, KpiGrid } from "@spy4x/preact-charts/kpi";
import { Button } from "@spy4x/preact-ui/button";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { Table } from "@spy4x/preact-ui/table";
import { ThemePreview } from "@spy4x/preact-ui/theme-preview";
import { THEME_PREVIEW_CSS } from "@spy4x/preact-theme";
import { FACT_LINK } from "../../FactCard.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import type { ToolLink } from "../../../lib/tools.ts";
import {
  ORBIT_MEDIAN_BUILD,
  ORBIT_PROJECTS,
  ORBIT_SNIPPET,
  ORBIT_STATUS,
} from "./orbit.ts";

const ITEM = "preact-components";

/** The library's preview palettes, and an instant switch under reduced motion. */
const PREVIEW_CSS = `${THEME_PREVIEW_CSS}
@media (prefers-reduced-motion: reduce) {
  [data-preview-frame] * { transition: none; }
}`;

/**
 * "Rendered by the library, on this page": a slice of the live guide's
 * Orbit demo (its buttons, KPI tiles and project table) in the library's
 * `ThemePreview`, whose Dark / Light radios repaint the frame with no script.
 * Rendered on the server by the published `@spy4x/preact-*` packages with no
 * island, then the demo's code in a `<details>` and the link to the guide.
 */
export function OrbitSlice({ live }: { live?: ToolLink }) {
  const builds = ORBIT_PROJECTS.reduce((sum, p) => sum + p.builds, 0);
  const failing = ORBIT_PROJECTS.filter((p) => p.status === "failing").length;
  return (
    <section aria-labelledby="rendered" data-orbit-slice>
      <h2 id="rendered" class="text-2xl sm:text-3xl text-parchment">
        Rendered by the library, on this page
      </h2>
      {
        /* The preview's two palettes, on this page only: every page would pay
          for them in the site stylesheet (#458). */
      }
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_CSS }} />
      <ThemePreview
        name="orbit-theme"
        labels={{ legend: "Theme of the preview" }}
        hideLegend
        class="mt-6"
        frameClass="p-3! sm:p-6!"
      >
        <figure aria-labelledby="orbit-label" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <figcaption
              id="orbit-label"
              class="text-sm font-semibold"
            >
              Orbit · Demo
            </figcaption>
            <div class="flex flex-wrap gap-2">
              <Button type="button" variant="outline">Run checks</Button>
              <Button type="button">New project</Button>
            </div>
          </div>
          <KpiGrid minWidth="8rem">
            <Kpi
              label="Projects"
              value={ORBIT_PROJECTS.length}
              tone="neutral"
            />
            <Kpi label="Builds" value={builds} sub="all time" tone="neutral" />
            <Kpi label="Failing" value={failing} tone="negative" />
            <Kpi
              label="Median build"
              value={ORBIT_MEDIAN_BUILD}
              tone="neutral"
            />
          </KpiGrid>
          <Table
            caption="Projects"
            captionClass="sr-only"
            class="min-h-0"
            headerSlot={
              <>
                <th scope="col" class="text-left">Project</th>
                <th scope="col" class="text-left">Status</th>
                <th scope="col" class="text-right">Builds</th>
              </>
            }
            bodyKeys={ORBIT_PROJECTS.map((p) => p.name)}
            bodySlots={ORBIT_PROJECTS.map((p) => (
              <>
                <td>{p.name}</td>
                <td>
                  <StatusMark
                    status={ORBIT_STATUS[p.status].mark}
                    label={ORBIT_STATUS[p.status].label}
                  />
                </td>
                <td class="text-right tabular-nums">{p.builds}</td>
              </>
            ))}
          />
        </figure>
      </ThemePreview>
      <p class="mt-4 text-graphite">
        Every component here is server-rendered by the published packages. The
        data is the guide's demo.
      </p>
      <details class="mt-4 group" data-orbit-code>
        <summary
          {...eventAttrs("tool-try", { item: ITEM, part: "code" })}
          class="cursor-pointer text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
        >
          Show the code
        </summary>
        <p class="mt-3 text-graphite">
          The guide's dashboard, which this slice is cut from:
        </p>
        <pre
          role="region"
          tabIndex={0}
          aria-label="The dashboard's code"
          class="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-rule bg-paper p-4 text-sm"
        ><code>{ORBIT_SNIPPET}</code></pre>
      </details>
      {live && (
        <p class="mt-4">
          <a
            href={live.href}
            {...eventAttrs("outbound", {
              to: "live",
              item: ITEM,
              place: "body",
            })}
            class={FACT_LINK}
          >
            {live.label}
          </a>
        </p>
      )}
    </section>
  );
}
