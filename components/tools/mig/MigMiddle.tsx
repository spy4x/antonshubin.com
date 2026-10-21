import type { ComponentChildren } from "preact"
import { FeatureCard } from "@spy4x/preact-ui/feature-card"
import { FACT_LINK } from "../../FactCard.tsx"
import { NewTabHint } from "../../NewTabHint.tsx"
import { COPY_INSTALL_TITLE } from "../../tool-frame/ToolBand.tsx"
import CopyButton from "../../../islands/CopyButton.tsx"
import MigTryCalendar from "../../../islands/MigTryCalendar.tsx"
import { embedUrl, NEW_TAB_LABEL } from "../../../lib/meet-embed.ts"
import { eventAttrs } from "../../../lib/analytics.ts"
import type { ToolPageData } from "../../tool-frame/tool-page.ts"
import type { Tool } from "../../../lib/tools.ts"

// The middle of /tools/mig (#457). Every sentence is mig's README's own
// (spy4x/mig README.md: the tagline, "Why mig", "Quick start", "Embed it").

/** The README's `compose.yml`, with the image pinned to `version` (such as `v2.0.0`). */
export function composeFile(version: string): string {
  return `# compose.yml
services:
  mig:
    image: antonshubin/mig:${version}
    restart: unless-stopped
    ports: ["8080:8080"]
    volumes: ["./data:/data:z"]
    env_file: .env`
}

/** The README's iframe snippet. */
export const EMBED_SNIPPET =
  `<iframe src="https://meet.example.com/embed?theme=dark" title="Book a meeting"
  style="width:100%;max-width:36rem;border:0"></iframe>`

/**
 * A block of code that scrolls sideways inside its own box, with a copy
 * button (`tool-install-copy`) above it. `id` must be unique on the page:
 * the button copies the block's text through it.
 */
function CodeBox(
  { id, label, name, title, code }: {
    id: string
    /** A visible label above the box; without one, `name` names the box. */
    label?: string
    name: string
    /** The copy button's tooltip and accessible name. */
    title: string
    code: string
  },
) {
  return (
    <div data-code-box class="min-w-0">
      <div class="flex items-center justify-between gap-3">
        {label
          ? <p id={`${id}-label`} class="text-sm text-graphite">{label}</p>
          : <span />}
        <CopyButton
          elementId={id}
          label="Copy"
          title={title}
          analytics={eventAttrs("tool-install-copy", { item: "mig" })}
        />
      </div>
      {
        /* Focusable and named, so a keyboard can scroll a long line into view. */
      }
      <div
        role="region"
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : name}
        tabIndex={0}
        class="mt-2 overflow-x-auto rounded-lg border border-rule bg-paper"
      >
        <pre class="p-4 text-sm leading-relaxed text-parchment"><code id={id}>{code}</code></pre>
      </div>
    </div>
  )
}

/** The hero's line under the actions: the README's compose file, pinned to the live version. */
export function ComposeQuickStart({ version }: { version: string }) {
  return (
    <CodeBox
      id="mig-compose"
      label="Run it with Docker Compose"
      name="compose.yml"
      title={COPY_INSTALL_TITLE}
      code={composeFile(version)}
    />
  )
}

/**
 * "Try it here": the real booking calendar, loaded in place on a press, with
 * the README's warning. Renders nothing while `SCHEDULE_URL` is unset.
 */
export function TryItHere({ scheduleUrl }: { scheduleUrl: string }) {
  if (!scheduleUrl) return null
  return (
    <section aria-labelledby="try" data-mig-try-section class="max-w-3xl">
      <h2 id="try" class="text-2xl sm:text-3xl text-parchment">Try it here</h2>
      <p class="mt-4 text-parchment">
        This is my real booking page, the same one behind Book. Book only if you
        want to talk.
      </p>
      <div class="mt-6 flex flex-col items-start gap-4">
        <MigTryCalendar
          url={embedUrl(scheduleUrl)}
          scheduleUrl={scheduleUrl}
          briefHref="/book#brief"
        />
        <a
          href={scheduleUrl}
          target="_blank"
          rel="noopener noreferrer"
          {...eventAttrs("outbound", {
            to: "live",
            item: "mig",
            place: "body",
          })}
          class={FACT_LINK}
        >
          {NEW_TAB_LABEL}
          <NewTabHint />
        </a>
      </div>
    </section>
  )
}

/**
 * The README's words that it sets as code, drawn as `<code>` inside a
 * reason. "?theme=" stays plain: it ends a sentence, and a tag before the
 * full stop would split the sentence in the page's text.
 */
const CODE_WORDS = /(\bcat\b|\.ics\b|\/embed\b)/

/** A reason's sentence with the README's code words set as `<code>`. */
function withCode(text: string): ComponentChildren {
  return text.split(CODE_WORDS).map((part, i) =>
    i % 2 ? <code key={i} class="text-parchment">{part}</code> : part
  )
}

/**
 * "Why mig": the entry's `features` (the README's reasons) as library
 * `FeatureCard`s. From 1024px three sit in the first row; the card with the
 * email screenshot takes two thirds of the next two rows and the last two
 * stack beside it.
 */
export function WhyMig({ tool }: { tool: Tool }) {
  if (!tool.features?.length) return null
  return (
    <section aria-labelledby="why">
      <h2 id="why" class="text-2xl sm:text-3xl text-parchment">Why mig</h2>
      <div data-mig-why class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {tool.features.map((f, i) => (
          <FeatureCard
            key={f.title}
            id={`why-${i + 1}`}
            title={f.title}
            class={f.shot
              ? "sm:col-span-2 lg:col-span-4 lg:row-span-2"
              : "lg:col-span-2"}
            media={f.shot && (
              <img
                src={f.shot.src}
                srcset={f.shot.srcset}
                sizes="(min-width: 1024px) 42rem, 100vw"
                alt={f.shot.alt}
                width={f.shot.width}
                height={f.shot.height}
                loading="lazy"
                decoding="async"
                class="block w-full h-auto"
              />
            )}
          >
            {withCode(f.text)}
          </FeatureCard>
        ))}
      </div>
    </section>
  )
}

/** "Embed it": the README's iframe snippet and what the frame tells its host page. */
export function EmbedIt() {
  return (
    <section aria-labelledby="embed" class="max-w-3xl">
      <h2 id="embed" class="text-2xl sm:text-3xl text-parchment">Embed it</h2>
      <div class="mt-4">
        <CodeBox
          id="mig-embed"
          name="Embed code"
          title="Copy the embed code"
          code={EMBED_SNIPPET}
        />
      </div>
      <p class="mt-4 text-graphite">
        The frame posts its height as its content changes and a message once
        when a visitor books, so the host page can resize the iframe and count
        booked calls.
      </p>
    </section>
  )
}

/** The middle's last line: mig has no status list, so only where the rest lives. */
export function OpenIssues({ data }: { data: ToolPageData }) {
  if (!data.repo) return null
  return (
    <p data-not-yet class="text-graphite">
      What is not built yet is on the{" "}
      <a
        href={`${data.repo}/issues`}
        {...eventAttrs("outbound", {
          to: "issues",
          item: "mig",
          place: "body",
        })}
        class={FACT_LINK}
      >
        open issues
      </a>.
    </p>
  )
}
