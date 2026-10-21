import type { Tool } from "../lib/tools.ts"
import { StatusMark } from "@spy4x/preact-ui/status-mark"
import { eventAttrs } from "../lib/analytics.ts"

const linkClass =
  "text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"

/** The Eirene credit, shown wherever a tool that carries one is listed. */
function Credit({ tool }: { tool: Tool }) {
  if (!tool.credit) return null
  return (
    <p data-credit class="relative z-10 mt-2 text-sm text-parchment">
      {tool.credit.text} {tool.credit.links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && " · "}
          <a href={l.href} class={linkClass}>{l.label}</a>
        </span>
      ))}
    </p>
  )
}

/**
 * One tool in a tool page's "More tools" strip: the name linking its page,
 * the job line and the status. The name's link is stretched over the card
 * (#336); the credit's links sit above it. The `/tools` hub draws its own
 * cards (`components/tools/hub/`).
 */
export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <li
      data-tool={tool.slug}
      class="relative bg-paper border border-rule rounded-xl p-5 transition-colors hover:border-rule-strong focus-within:border-rule-strong"
    >
      <h3 class="text-xl text-parchment">
        <a
          href={`/tools/${tool.slug}`}
          {...eventAttrs("cta", {
            place: "body",
            target: `/tools/${tool.slug}`,
          })}
          class="underline-offset-4 hover:underline after:absolute after:inset-0 after:rounded-xl"
        >
          {tool.name}
        </a>
      </h3>
      <p class="mt-1 text-graphite">{tool.job}.</p>
      <Credit tool={tool} />
      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-graphite">
        <StatusMark status={tool.status} />
      </div>
    </li>
  )
}
