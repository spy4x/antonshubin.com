import { FACT_LINK } from "../../FactCard.tsx"
import CopyButton from "../../../islands/CopyButton.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import { CLIENTS_GUIDE, DESKTOP_CONFIG } from "./data.ts"

const SLUG = "caldav-mcp"
const FILE = "claude_desktop_config.json"

/**
 * "Add it to Claude Desktop": the README's quick start, its config block with
 * a copy button (`tool-install-copy`), and the one test question. The block's
 * long `--allow-env` line scrolls inside the block, never the page.
 */
export function DesktopConfig() {
  return (
    <section aria-labelledby="mcp-desktop" data-mcp-config class="max-w-4xl">
      <h2 id="mcp-desktop" class="text-2xl sm:text-3xl text-parchment">
        Add it to Claude Desktop
      </h2>
      <p class="mt-3 text-graphite [&_code]:whitespace-nowrap">
        Install Deno, then add this to Claude Desktop's{" "}
        <code>{FILE}</code>. Replace <code>cal.example.com</code> in{" "}
        <code>--allow-net</code> with the host of your <code>CALDAV_URL</code>.
      </p>
      <div class="mt-4 overflow-hidden rounded-xl border border-rule bg-paper">
        <div class="flex items-center justify-between gap-3 border-b border-rule px-4 py-1.5">
          <span class="text-sm text-graphite">{FILE}</span>
          <CopyButton
            elementId="mcp-desktop-config"
            label="Copy"
            title={`Copy ${FILE}`}
            analytics={eventAttrs("tool-install-copy", { item: SLUG })}
          />
        </div>
        <pre
          tabIndex={0}
          aria-label={FILE}
          class="overflow-x-auto p-4 text-sm text-parchment"
        ><code id="mcp-desktop-config">{DESKTOP_CONFIG}</code></pre>
      </div>
      <p class="mt-4 text-graphite">
        Restart Claude Desktop and ask "Which calendars do I have?". OpenCode,
        OpenWebUI and Cursor are in the{" "}
        <a
          href={CLIENTS_GUIDE}
          {...eventAttrs("outbound", {
            to: "github",
            item: SLUG,
            place: "body",
          })}
          class={FACT_LINK}
        >
          clients guide
        </a>.
      </p>
    </section>
  )
}
