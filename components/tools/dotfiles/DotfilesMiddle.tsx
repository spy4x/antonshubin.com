import { Card } from "@spy4x/preact-ui/card"
import { FACT_LINK } from "../../FactCard.tsx"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { ToolPageData } from "../../tool-frame/tool-page.ts"
import {
  CHECK_LINE,
  HARNESS_MAP,
  HARNESSES,
  INSTALL_WARNING,
  SETUP_CARDS,
  WORKSTATION,
} from "./content.ts"

const ITEM = "dotfiles"

/** A path in monospace that breaks anywhere rather than widen a 390px page. */
function Path({ children }: { children: string }) {
  return (
    <code class="font-mono text-parchment [overflow-wrap:anywhere]">
      {children}
    </code>
  )
}

/** The README's warning under the hero's quick start. */
export function InstallWarning() {
  return (
    <p data-install-warning class="mt-3 text-sm text-graphite">
      {INSTALL_WARNING[0]} <code class="font-mono">deno task install-all</code>
      {" "}
      {INSTALL_WARNING[1]}
    </p>
  )
}

/**
 * "Where each file goes" (#460): ai-harnesses/README.md's layout table. From
 * 1024px a real table (caption, row headers, the row under the pointer
 * tinted); below it one disclosure per source, whose summary sends
 * `tool-try` with `part: harness-map`. No island.
 */
export function HarnessMap() {
  return (
    <section aria-labelledby="harness-map" data-harness-map>
      <h2 id="harness-map" class="text-2xl sm:text-3xl text-parchment">
        Where each file goes
      </h2>
      <table class="mt-6 hidden w-full table-fixed border-collapse text-left text-sm lg:table">
        <caption class="sr-only">
          Where each source file is written, per harness
        </caption>
        <thead>
          <tr class="border-b border-rule-strong">
            <th
              scope="col"
              class="w-1/4 py-3 pr-4 font-semibold text-parchment"
            >
              Source
            </th>
            {HARNESSES.map((h) => (
              <th
                key={h.name}
                scope="col"
                class="py-3 pr-4 font-semibold text-parchment"
              >
                {h.name}
                <span class="block font-mono text-xs font-normal text-graphite">
                  {h.home}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HARNESS_MAP.map((row) => (
            <tr key={row.source} class="border-b border-rule hover:bg-lamp">
              <th scope="row" class="py-3 pl-2 pr-4 align-top font-normal">
                <Path>{row.source}</Path>
              </th>
              {row.targets.map((t, i) => (
                <td key={i} class="py-3 pr-4 align-top">
                  <Path>{t}</Path>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div class="mt-6 space-y-3 lg:hidden">
        {HARNESS_MAP.map((row, n) => (
          <details
            key={row.source}
            open={n === 0}
            class="rounded-lg border border-rule bg-paper"
          >
            <summary
              {...eventAttrs("tool-try", { item: ITEM, part: "harness-map" })}
              class="cursor-pointer px-4 py-3 text-sm"
            >
              <Path>{row.source}</Path>
            </summary>
            <dl class="space-y-2 border-t border-rule px-4 py-3 text-sm">
              {HARNESSES.map((h, i) => (
                <div
                  key={h.name}
                  class="grid grid-cols-[7rem_minmax(0,1fr)] gap-3"
                >
                  <dt class="text-graphite">{h.name}</dt>
                  <dd>
                    <Path>{row.targets[i]}</Path>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
      <p class="mt-6 text-graphite leading-relaxed">
        <code class="font-mono text-parchment">--check</code> {CHECK_LINE}
      </p>
    </section>
  )
}

/**
 * "The AI-agent setup" (#460): the README's six bullets as cards, each
 * linking the files it names (`outbound`, `place: card`), then the
 * workstation's eight bullets under one closed disclosure.
 */
export function AgentSetup() {
  return (
    <section aria-labelledby="agent-setup" data-agent-setup>
      <h2 id="agent-setup" class="text-2xl sm:text-3xl text-parchment">
        The AI-agent setup
      </h2>
      <ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETUP_CARDS.map((c) => (
          <li key={c.title} class="flex">
            <Card class="flex w-full flex-col p-6">
              <h3 class="text-lg text-parchment">{c.title}</h3>
              <p class="mt-2 flex-1 text-graphite leading-relaxed">{c.text}</p>
              <p class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {c.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    {...eventAttrs("outbound", {
                      to: "github",
                      item: ITEM,
                      place: "card",
                    })}
                    class={`${FACT_LINK} font-mono [overflow-wrap:anywhere]`}
                  >
                    {l.label}
                  </a>
                ))}
              </p>
            </Card>
          </li>
        ))}
      </ul>
      <details
        data-dotfiles-workstation
        class="mt-8 rounded-lg border border-rule"
      >
        <summary class="cursor-pointer px-4 py-3 font-semibold text-parchment">
          The workstation
        </summary>
        <ul class="space-y-2 border-t border-rule px-4 py-4 text-graphite">
          {WORKSTATION.map(([label, line]) => (
            <li key={label}>
              <span class="font-semibold text-parchment">{label}</span> {line}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}

/** "Where it stands" beside the facts card: `usedFor` and the open issues. */
export function DotfilesStanding({ data }: { data: ToolPageData }) {
  const { tool, repo } = data
  return (
    <section aria-labelledby="standing">
      <h2 id="standing" class="text-2xl sm:text-3xl text-parchment">
        Where it stands
      </h2>
      <p class="mt-4 text-parchment leading-relaxed">{tool.usedFor}</p>
      {repo && (
        <p data-not-yet class="mt-3 text-graphite">
          What is not built yet is on the{" "}
          <a
            href={`${repo}/issues`}
            {...eventAttrs("outbound", {
              to: "issues",
              item: ITEM,
              place: "body",
            })}
            class={FACT_LINK}
          >
            open issues
          </a>.
        </p>
      )}
    </section>
  )
}
