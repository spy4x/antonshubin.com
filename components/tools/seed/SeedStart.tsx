import { FACT_LINK } from "../../FactCard.tsx"
import { COPY_INSTALL_TITLE, QuickStart } from "../../tool-frame/ToolBand.tsx"
import CopyButton from "../../../islands/CopyButton.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { Tool } from "../../../lib/tools.ts"

/** The README's start-up commands after the quick start's first one, verbatim. */
export const NEXT_COMMANDS = [
  "cd my-product",
  "cp infra/envs/.env.example infra/envs/.env",
  "deno task vapid-key:create",
  "deno task proxy:start",
  "deno task dev",
]

/** The README's Quick start section in spy4x/seed. */
const QUICK_START_DOCS = "https://github.com/spy4x/seed#quick-start"

/**
 * The line under Seed's hero actions (#455): the website link, the quick
 * start with its copy button, and a `<details>` "The next commands" holding
 * the rest of the README's start-up commands in one block with one copy
 * button, the secrets reminder and a link to the README's full quick start.
 */
export function SeedStart({ tool }: { tool: Tool }) {
  return (
    <div class="space-y-4">
      {tool.website && (
        <p class="text-sm text-graphite">
          Website:{" "}
          <a
            href={tool.website}
            {...eventAttrs("outbound", {
              to: "website",
              item: tool.slug,
              place: "hero",
            })}
            class={FACT_LINK}
          >
            {new URL(tool.website).host}
          </a>
        </p>
      )}
      <QuickStart tool={tool} id={`quick-start-${tool.slug}`} />
      <details data-seed-next class="group">
        <summary class="cursor-pointer text-sm text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment">
          The next commands
        </summary>
        <div class="mt-3 flex items-start gap-3 rounded-lg border border-rule bg-paper py-2.5 pl-3 pr-3">
          <pre class="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-parchment"><code id="seed-next-commands">{NEXT_COMMANDS.join("\n")}</code></pre>
          <CopyButton
            elementId="seed-next-commands"
            label="Copy"
            title={COPY_INSTALL_TITLE}
            analytics={eventAttrs("tool-install-copy", { item: tool.slug })}
          />
        </div>
        <p class="mt-3 text-sm text-graphite">
          Fill in the secrets in <code>infra/envs/.env</code> first. Then open
          {" "}
          <code>http://app.localhost</code>.
        </p>
        <p class="mt-2 text-sm">
          <a
            href={QUICK_START_DOCS}
            {...eventAttrs("outbound", {
              to: "github",
              item: tool.slug,
              place: "hero",
            })}
            class={FACT_LINK}
          >
            The full quick start
          </a>
        </p>
      </details>
    </div>
  )
}
