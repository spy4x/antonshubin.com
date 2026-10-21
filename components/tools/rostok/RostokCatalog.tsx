import { Fragment } from "preact"
import { FACT_LINK } from "../../FactCard.tsx"
import CopyButton from "../../../islands/CopyButton.tsx"
import { eventAttrs, linkEvent } from "../../../lib/analytics.ts"
import { catalogGroups, type RostokStack } from "../../../lib/rostok-catalog.ts"
import { findTool } from "../../../lib/tools.ts"

const CHIP =
  "rounded border border-rule bg-ink px-1.5 py-0.5 text-xs text-parchment break-all"

/** A list of variable keys as code chips, or "none". */
function Keys({ keys }: { keys: string[] }) {
  if (keys.length === 0) return <span class="text-graphite">none</span>
  return (
    <span class="inline-flex flex-wrap gap-1.5 align-middle">
      {keys.map((k) => <code key={k} class={CHIP}>{k}</code>)}
    </span>
  )
}

/**
 * One stack as a native `<details>`: its name and description in the
 * summary; open, the keys it requires, its secrets, the command that adds
 * it with a copy button, and a link to its page when it is one of my tools.
 * Opening works without JavaScript; the summary click sends `tool-try`.
 */
function Stack({ stack }: { stack: RostokStack }) {
  const id = `add-${stack.name}`
  const own = findTool(stack.name)
  const command = ["rostok", "stack", "add", stack.name, "--server=home"]
  return (
    <details
      data-stack={stack.name}
      class="rounded-lg border border-rule bg-paper"
    >
      <summary
        {...eventAttrs("tool-try", {
          item: "rostok",
          part: `stack:${stack.name}`,
        })}
        class="cursor-pointer px-4 py-3 marker:text-graphite"
      >
        <code class="font-semibold text-parchment">{stack.name}</code>
        <span class="block pl-4 text-sm text-graphite leading-relaxed">
          {stack.description}
        </span>
      </summary>
      <div class="space-y-3 border-t border-rule px-4 py-4 text-sm">
        <p class="text-graphite">
          Asks for: <Keys keys={stack.required} />
        </p>
        <p class="text-graphite">
          Secrets: <Keys keys={stack.secret} />
          {stack.secret.length > 0 && (
            <span class="block mt-1">
              Encrypted into <code>.env.age</code>, so the repo is safe to push.
            </span>
          )}
        </p>
        <div class="flex items-center gap-3 rounded-lg border border-rule bg-ink py-2 pl-3 pr-3">
          <code id={id} class="min-w-0 flex-1 text-parchment">
            {command.map((arg, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span class="inline-block whitespace-nowrap">{arg}</span>
              </Fragment>
            ))}
          </code>
          <CopyButton
            elementId={id}
            label="Copy"
            title={`Copy the command to add ${stack.name}`}
            analytics={eventAttrs("tool-install-copy", {
              item: "rostok",
              part: `stack:${stack.name}`,
            })}
          />
        </div>
        {own && (
          <p>
            <a
              href={`/tools/${own.slug}`}
              {...linkEvent(`/tools/${own.slug}`, { place: "body" })}
              class={FACT_LINK}
            >
              This tool's page
            </a>
          </p>
        )}
      </div>
    </details>
  )
}

/**
 * The rostok page's middle (#461): every stack of the pinned catalog
 * (`lib/rostok-catalog.json`), grouped by category under an index of anchor
 * links. The index wraps as a chip row on a phone and is a sticky column
 * from 1024px; it needs no JavaScript and tracks nothing.
 */
export function RostokCatalog() {
  const groups = catalogGroups()
  const total = groups.reduce((n, g) => n + g.stacks.length, 0)
  return (
    <section aria-labelledby="catalog" data-rostok-catalog>
      <h2 id="catalog" class="text-2xl text-parchment">The catalog</h2>
      <p class="mt-3 max-w-3xl text-graphite leading-relaxed">
        {total}{" "}
        stacks. Each is an ordinary Docker Compose file you can read and change.
      </p>
      <div class="mt-8 grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <nav
          aria-label="Jump to a category"
          class="lg:sticky lg:top-6 lg:self-start"
        >
          <ul class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {groups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#stacks-${g.id}`}
                  class="flex min-h-11 items-center gap-2 rounded-lg border border-rule px-3 text-sm text-parchment hover:bg-lamp lg:min-h-9 lg:justify-between lg:border-transparent"
                >
                  {g.label}
                  <span class="text-graphite">{g.stacks.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div class="min-w-0 space-y-10">
          {groups.map((g) => (
            <section
              key={g.id}
              aria-labelledby={`stacks-${g.id}`}
            >
              <h3
                id={`stacks-${g.id}`}
                class="flex scroll-mt-8 items-baseline gap-3 text-xl text-parchment"
              >
                {g.label}
                <span class="font-sans text-sm font-normal text-graphite">
                  {g.stacks.length} {g.stacks.length === 1 ? "stack" : "stacks"}
                </span>
              </h3>
              <ul class="mt-4 grid items-start gap-3 sm:grid-cols-2">
                {g.stacks.map((s) => (
                  <li key={s.name} class="min-w-0">
                    <Stack stack={s} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
