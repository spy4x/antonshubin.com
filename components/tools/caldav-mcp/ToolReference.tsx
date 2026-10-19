import { IconChevronRight, IconLockClosed } from "@spy4x/preact-icons";
import { eventAttrs } from "../../../lib/analytics.ts";
import {
  GROUPS,
  isToolOffered,
  MCP_TOOLS,
  type McpTool,
  MODES,
  splitDescription,
  type ToolMode,
} from "./data.ts";

const SLUG = "caldav-mcp";
const MODE_VALUES = MODES.map((m) => m.value);

/** The radio id of a mode; the switch's CSS reads these. */
const modeId = (mode: ToolMode) => `mcp-mode-${mode}`;

/** The modes that leave `name` out, space-separated, for `data-when` and `data-off`. */
function offIn(name: string): string {
  return MODE_VALUES.filter((m) => !isToolOffered(name, m)).join(" ");
}

/**
 * The switch's whole behaviour, in CSS on the section (no island): an element
 * with `data-when` shows only while one of the modes it lists is checked, and
 * a tool name with `data-off` turns Graphite while a mode it lists is checked.
 * The class strings are written out in full so Tailwind finds them.
 */
const SWITCH_CSS = [
  "[&:has(#mcp-mode-all:checked)_[data-when]:not([data-when~=all])]:hidden",
  "[&:has(#mcp-mode-no-delete:checked)_[data-when]:not([data-when~=no-delete])]:hidden",
  "[&:has(#mcp-mode-read-only:checked)_[data-when]:not([data-when~=read-only])]:hidden",
  "[&:has(#mcp-mode-no-delete:checked)_[data-off~=no-delete]]:text-graphite",
  "[&:has(#mcp-mode-read-only:checked)_[data-off~=read-only]]:text-graphite",
].join(" ");

/** One tool: a native `<details>` whose summary names it and gives its first sentence. */
function ToolRow({ tool }: { tool: McpTool }) {
  const { first, rest } = splitDescription(tool.description);
  const off = offIn(tool.name);
  const offered = MODE_VALUES.filter((m) => isToolOffered(tool.name, m));
  return (
    <details data-mcp-tool={tool.name} class="group border-t border-rule">
      <summary
        {...eventAttrs("tool-try", { item: SLUG, part: `tool:${tool.name}` })}
        class="flex cursor-pointer list-none gap-2 py-3 [&::-webkit-details-marker]:hidden"
      >
        <IconChevronRight class="mt-1 size-4 shrink-0 text-graphite transition-transform group-open:rotate-90" />
        <span class="min-w-0">
          <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <code
              data-off={off || undefined}
              class="whitespace-nowrap text-parchment"
            >
              {tool.name}
            </code>
            {off && (
              <span
                data-when={off}
                data-not-offered
                class="inline-flex items-center gap-1 text-sm text-graphite"
              >
                <IconLockClosed class="size-3.5" aria-hidden="true" />
                Not offered
              </span>
            )}
          </span>
          <span class="mt-1 block text-sm text-graphite">{first}</span>
        </span>
      </summary>
      <div class="space-y-3 pb-4 pl-6 text-sm text-graphite">
        {rest && <p>{rest}</p>}
        {tool.example && (
          <div>
            <p class="font-semibold text-parchment">Example</p>
            <pre
              tabIndex={0}
              aria-label={`Example call of ${tool.name}`}
              class="mt-1 overflow-x-auto rounded-lg border border-rule bg-ink p-3 text-xs text-parchment"
            ><code>{tool.example}</code></pre>
          </div>
        )}
        <p>Offered with CALDAV_MCP_TOOLS set to {offered.join(", ")}.</p>
      </div>
    </details>
  );
}

/**
 * The page's unique middle (#463): all 13 MCP tools, grouped, under a
 * three-way switch that mirrors `CALDAV_MCP_TOOLS`. The tools the chosen
 * mode leaves out stay in the list, marked "Not offered", so a reader sees
 * what is withheld. Native radios and `<details>`, so it works without
 * JavaScript; the CSS is {@link SWITCH_CSS}.
 */
export function ToolReference() {
  return (
    <section
      aria-labelledby="mcp-tools"
      data-mcp-reference
      class={SWITCH_CSS}
    >
      <h2 id="mcp-tools" class="text-2xl sm:text-3xl text-parchment">
        What the assistant can do
      </h2>
      <fieldset class="mt-5">
        <legend class="text-parchment">Which tools the server offers</legend>
        <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              {...eventAttrs("tool-try", {
                item: SLUG,
                part: `mode:${m.value}`,
              })}
              class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-parchment sm:min-h-8"
            >
              <input
                type="radio"
                name="mcp-mode"
                id={modeId(m.value)}
                value={m.value}
                checked={m.value === "all"}
                class="size-4 accent-parchment"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-hidden="true" data-mode-echo class="mt-3 text-sm text-graphite">
        {MODES.map((m) => (
          <code key={m.value} data-when={m.value}>
            CALDAV_MCP_TOOLS={m.value}
          </code>
        ))}
      </p>
      <p aria-live="polite" data-mode-note class="mt-2 max-w-3xl text-graphite">
        {MODES.map((m) => (
          <span key={m.value} data-when={m.value}>{m.note}</span>
        ))}
      </p>
      <div class="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-6">
        {GROUPS.map((group) => {
          const list = MCP_TOOLS.filter((t) => t.group === group);
          const id = `mcp-group-${group.toLowerCase()}`;
          return (
            <section
              key={group}
              aria-labelledby={id}
              data-mcp-group={group}
              class="min-w-0 rounded-xl border border-rule bg-paper px-4 pt-3"
            >
              <h3
                id={id}
                class="flex items-baseline gap-3 pb-3 text-lg text-parchment"
              >
                {group}
                <span class="font-sans text-sm text-graphite">
                  {list.length}
                  {MODE_VALUES.filter((m) => m !== "all").map((m) => (
                    <span key={m} data-when={m}>
                      {" · "}
                      {list.filter((t) =>
                        isToolOffered(t.name, m)
                      ).length} offered
                    </span>
                  ))}
                </span>
              </h3>
              {list.map((t) => <ToolRow key={t.name} tool={t} />)}
            </section>
          );
        })}
      </div>
    </section>
  );
}
