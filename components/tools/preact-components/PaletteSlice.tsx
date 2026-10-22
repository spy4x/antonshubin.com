import { Kbd } from "@spy4x/preact-ui/kbd"
import { ThemePreview } from "@spy4x/preact-ui/theme-preview"
import { THEME_PREVIEW_CSS } from "@spy4x/preact-theme"
import PaletteDemo from "../../../islands/PaletteDemo.tsx"
import { FACT_LINK } from "../../FactCard.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { Tool } from "../../../lib/tools.ts"
import { PaletteDemoLive } from "./PaletteDemoLive.tsx"
import { PREVIEW_THEME_NAME } from "./palette.ts"
import { PALETTE_COMPONENTS } from "./palette-index.ts"

const ITEM = "preact-components"

/**
 * The library's preview palettes, the stage's 150 ms fade, the keys line's
 * ⌘ once the demo knows it runs on Apple, and no motion under reduced motion.
 */
const PREVIEW_CSS = `${THEME_PREVIEW_CSS}
@keyframes palette-stage-in { from { opacity: 0; } }
.palette-stage-in { animation: palette-stage-in 150ms ease-out; }
[data-keys=cmd] { display: none; }
[data-preview-frame]:has([data-apple=true]) [data-keys=cmd] { display: inline; }
[data-preview-frame]:has([data-apple=true]) [data-keys=ctrl] { display: none; }
@media (prefers-reduced-motion: reduce) {
  [data-preview-frame] * { transition: none; }
  .palette-stage-in { animation: none; }
}`

/**
 * The island's `CommandPalette` call, as "Show the code" shows it: the
 * lines between `palette:start` and `palette:end` in PaletteDemoLive.tsx,
 * which test/tools/preact-components.test.ts holds equal.
 */
export const PALETTE_SNIPPET = `<CommandPalette<Row>
  trigger="field"
  hotkeys={["mod+k", "/"]}
  search={async (query) => {
    lastQuery.current = query
    const rows = await loadRows()
    return query.trim() === ""
      ? [...commands, ...rows.filter((r) => r.group === "Start here")]
      // Components first, so a tie goes to the component, not a command.
      : matchOptions(
        [
          ...rows.filter((r) => r.group === "Components"),
          ...commands,
        ],
        query,
      )
  }}
  debounce={0}
  defaultQuery={chipQuery.value ?? ""}
  onSelect={pick}
  labels={{
    ...PALETTE_LABELS,
    placeholder: PALETTE_LABELS.placeholder(count),
  }}
  class="h-12! text-base!"
/>`

/** The keys line, in the library's `Kbd`: Ctrl K, or ⌘K once the demo knows it runs on Apple. */
function KeysLine() {
  return (
    <>
      <span data-keys="ctrl">
        <Kbd keys="ctrl+k" />
      </span>
      <span data-keys="cmd">
        <Kbd keys="mod+k" apple />
      </span>{" "}
      or <Kbd keys="/" /> opens it. <Kbd keys="arrowup" />{" "}
      <Kbd keys="arrowdown" /> moves, <Kbd keys="enter" /> picks,{" "}
      <Kbd keys="escape" /> closes.
    </>
  )
}

/**
 * "Search the library from the keyboard" (#522): the library's
 * `CommandPalette`, `Toastr` and `ThemePreview` running on this page, the
 * palette over the library's own components (PaletteDemoLive.tsx, loaded by
 * islands/PaletteDemo.tsx), then
 * the demo's code in a `<details>` and the link to the guide.
 */
export function PaletteSlice({ tool }: { tool: Tool }) {
  const { live, registry } = tool
  const guideHref = live?.href ?? ""
  const demo = {
    count: PALETTE_COMPONENTS.length,
    guideHref,
    install: registry?.install ?? "",
  }
  return (
    <section aria-labelledby="palette-demo" data-palette-slice>
      <h2 id="palette-demo" class="text-2xl sm:text-3xl text-parchment">
        Search the library from the keyboard
      </h2>
      <p class="mt-3 text-graphite">
        This search is the library's CommandPalette, running here over its own
        components. Type the way you do in a hurry: a typo, the wrong keyboard
        layout, or Russian.
      </p>
      {
        /* The preview's two palettes, on this page only: every page would pay
          for them in the site stylesheet (#458). */
      }
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_CSS }} />
      <ThemePreview
        name={PREVIEW_THEME_NAME}
        labels={{ legend: "Theme of the preview" }}
        hideLegend
        class="mt-6"
        frameClass="p-3! sm:p-6!"
        inputAttributes={{
          dark: eventAttrs("tool-try", { item: ITEM, part: "theme-dark" }),
          light: eventAttrs("tool-try", { item: ITEM, part: "theme-light" }),
        }}
      >
        <PaletteDemo
          {...demo}
          ssr={<PaletteDemoLive {...demo} />}
        />
        <p
          data-palette-keys
          class="mt-4 text-sm text-muted pointer-coarse:hidden"
        >
          <KeysLine />
        </p>
      </ThemePreview>
      <noscript>
        <p data-palette-noscript class="mt-4 text-parchment">
          The search needs JavaScript.{" "}
          <a href={guideHref} class={FACT_LINK}>
            The live UI guide lists every component.
          </a>
        </p>
      </noscript>
      <p class="mt-4 text-graphite">
        The search, the toast and both themes are the library's own components,
        running on this page.
      </p>
      <details class="mt-4 group" data-palette-code>
        <summary
          {...eventAttrs("tool-try", { item: ITEM, part: "code" })}
          class="cursor-pointer text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"
        >
          Show the code
        </summary>
        <p class="mt-3 text-graphite">This demo's search, in full:</p>
        <pre
          role="region"
          tabIndex={0}
          aria-label="The demo's code"
          class="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-rule bg-paper p-4 text-sm"
        ><code>{PALETTE_SNIPPET}</code></pre>
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
  )
}
