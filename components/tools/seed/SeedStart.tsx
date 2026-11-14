import { FACT_LINK } from "../../FactCard.tsx"
import { QuickStart } from "../../tool-frame/ToolBand.tsx"
import CopyButton from "../../../islands/CopyButton.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { Tool } from "../../../lib/tools.ts"

/**
 * The README's start-up commands after the quick start's first one, verbatim,
 * split after `init`: `init` asks for the project name, so a pasted
 * `deno task dev` behind it would be read as the answer.
 */
export const SETUP_COMMANDS = ["cd my-product", "deno task init"]
export const DEV_COMMANDS = ["deno task dev"]

/** The README's Quick start section in spy4x/seed. */
const QUICK_START_DOCS = "https://github.com/spy4x/seed#quick-start"

/**
 * The line under Seed's hero actions (#455): the website link, the quick
 * start with its copy button, and a `<details>` "The next commands" holding
 * the rest of the README's start-up commands in two blocks, each with its own
 * copy button, split where `init` asks for the project name, and a link to
 * the README's full quick start.
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
        <CommandBlock
          id="seed-setup-commands"
          commands={SETUP_COMMANDS}
          title="Copy the set-up commands"
          slug={tool.slug}
        />
        <p class="mt-3 text-sm text-graphite">
          <code>init</code> generates the secrets in{" "}
          <code>infra/envs/.env</code>{" "}
          and asks for the project name. Answer it, then run:
        </p>
        <CommandBlock
          id="seed-dev-command"
          commands={DEV_COMMANDS}
          title="Copy the start command"
          slug={tool.slug}
        />
        <p class="mt-3 text-sm text-graphite">
          Then open <code>http://app.localhost</code>.
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

/** One block of start-up commands with its own copy button (`tool-install-copy`). */
function CommandBlock(
  { id, commands, title, slug }: {
    /** Unique on the page: the copy button reads the commands through it. */
    id: string
    commands: string[]
    /** The copy button's tooltip and accessible name: what it copies. */
    title: string
    slug: string
  },
) {
  return (
    <div class="mt-3 flex items-start gap-3 rounded-lg border border-rule bg-paper py-2.5 pl-3 pr-3">
      <pre class="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-parchment"><code id={id}>{commands.join("\n")}</code></pre>
      <CopyButton
        elementId={id}
        label="Copy"
        title={title}
        analytics={eventAttrs("tool-install-copy", { item: slug })}
      />
    </div>
  )
}
