import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import { eventAttrs } from "../../../lib/analytics.ts"
import { CodeBlock } from "./CodeBlock.tsx"

/** One state a card can be in, with its real crop from the staged oko demo. */
interface CardState {
  value: "up" | "down" | "unknown"
  label: string
  note: string
  alt: string
}

/** The state chosen before any click: its picture and note show first. */
const FIRST_STATE = "up"

const STATES: CardState[] = [
  {
    value: "up",
    label: "Up",
    note: "Up, down and 30-day uptime come from gatus.",
    alt:
      "An oko card for Audiobooks, up, with a 30-day uptime pill reading 90.32%.",
  },
  {
    value: "down",
    label: "Down",
    note: "The card gets a red border and keeps its 30-day uptime from gatus.",
    alt:
      "An oko card for Audiobooks, down: a red border, and a grey pill reading 80.00%.",
  },
  {
    value: "unknown",
    label: "Gatus didn't answer",
    note:
      'When gatus gives no answer for a service, the card gets a dashed "unknown" marker instead of a red border, and the section counter reports it separately. Failed upstream is not the same as failed service.',
    alt:
      "An oko card for Audiobooks with a dashed border and an unknown marker instead of an uptime pill.",
  },
]

/**
 * A field's number on the card and in the JSON, and where its marker sits on
 * the crop, in percent so it scales with the picture.
 */
const MARKERS = [
  { n: 1, left: 19, top: 46 },
  { n: 2, left: 4, top: 9 },
  { n: 3, left: 33, top: 27 },
  { n: 4, left: 7, top: 62 },
  { n: 5, left: 17, top: 84 },
  { n: 6, left: 57, top: 17 },
]

/**
 * The Audiobooks entry from oko's docs/configuration.md, line by line, with
 * the field each line feeds. The icon is written as its JSON escape: the
 * site renders no emoji (test/no-emoji.test.ts), and the escape is the same
 * value to oko.
 */
const LINES: { text: string; field?: number }[] = [
  { text: "{" },
  { text: '  "name": "Audiobooks",', field: 1 },
  { text: '  "url": "https://books.${DOMAIN}",', field: 2 },
  { text: '  "icon": "\\ud83d\\udcda",', field: 3 },
  {
    text: '  "description": "Audiobook and podcast library with streaming",',
    field: 4,
  },
  { text: '  "product": "Audiobookshelf",', field: 5 },
  { text: '  "product_url": "https://www.audiobookshelf.org/",', field: 5 },
  { text: '  "endpoint": "home_audiobookshelf",', field: 6 },
  { text: '  "gatus_host": "uptime-cloud"', field: 6 },
  { text: "}" },
]

/** What each number means, from oko's docs/configuration.md. */
const LEGEND = [
  <span key="1">
    <code>name</code> — the card's title. Required.
  </span>,
  <span key="2">
    <code>url</code> — where the card links. <code>${"{DOMAIN}"}</code>{" "}
    is replaced with the <code>DOMAIN</code> env var. Required.
  </span>,
  <span key="3">
    <code>icon</code> — any emoji or short text.
  </span>,
  <span key="4">
    <code>description</code> — the line under the title.
  </span>,
  <span key="5">
    <code>product</code> + <code>product_url</code>{" "}
    — a small attribution link below the description, only when{" "}
    <code>product_url</code> is set.
  </span>,
  <span key="6">
    <code>endpoint</code> + <code>gatus_host</code>{" "}
    — the gatus lookup. Set both or neither; with neither, the card has no
    status pill.
  </span>,
]

/** A small numbered circle; decorative, the legend carries the meaning. */
function Marker(
  { n, class: extra = "", ...data }: {
    n: number
    class?: string
    "data-oko-marker"?: number
  },
) {
  return (
    <span
      {...data}
      aria-hidden="true"
      class={`grid size-5 place-items-center rounded-full bg-parchment text-xs font-semibold text-ink ${extra}`}
    >
      {n}
    </span>
  )
}

/** The section's id, which scopes {@link PAGE_CSS}. */
const ROOT = "oko-config-to-card"

/**
 * This section's own CSS, rendered in a `<style>` here so it reaches
 * /tools/oko only, never the stylesheet every page loads: the state swap
 * (every picture and note hidden, then the chosen one shown, Up until another
 * is chosen) and the outline a marker gets while its JSON line is hovered or
 * focused.
 */
const LATER = STATES.filter((s) => s.value !== FIRST_STATE)
export const PAGE_CSS = [
  `#${ROOT} [data-oko-state]{display:none}`,
  [
    `#${ROOT}:not(:has(${
      LATER.map((s) => `#oko-state-${s.value}:checked`).join(",")
    })) [data-oko-state=${FIRST_STATE}]`,
    ...LATER.map((s) =>
      `#${ROOT}:has(#oko-state-${s.value}:checked) [data-oko-state=${s.value}]`
    ),
  ].join(",") + "{display:block}",
  `#${ROOT} [data-line]:is(:hover,:focus-visible){background:var(--color-lamp)}`,
  MARKERS.map((m) =>
    `#${ROOT}:has([data-line="${m.n}"]:is(:hover,:focus-visible)) [data-oko-marker="${m.n}"]`
  ).join(",") + "{outline:2px solid var(--color-sage);outline-offset:2px}",
].join("")

/**
 * oko's page, part 4 (#464): "From config to card". A `config.json` entry
 * beside the card oko renders from it, with numbered markers on both and a
 * numbered legend; the library's `RadioChips` (native radios) swap the
 * card between its real up, down and unknown crops. No island: the swap is
 * CSS `:has()` in {@link PAGE_CSS}, and the two hidden pictures are
 * `display: none` with `loading="lazy"`, so the browser fetches each only
 * once it is chosen. Hovering or focusing a JSON line outlines its marker on
 * the card.
 */
export function ConfigToCard() {
  return (
    <section id={ROOT} aria-labelledby="config-to-card">
      {/* Set as HTML: as text, the attribute selectors' quotes would be escaped. */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <h2 id="config-to-card" class="text-2xl sm:text-3xl text-parchment">
        From config to card
      </h2>
      <div class="mt-6 grid gap-8 lg:grid-cols-12 lg:items-start">
        <div class="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <RadioChips
            legend="What gatus says"
            legendClass="mb-2 text-sm text-graphite"
            name="oko-card-state"
            defaultValue={FIRST_STATE}
            options={STATES.map((s) => ({
              value: s.value,
              label: s.label,
              id: `oko-state-${s.value}`,
              inputAttributes: eventAttrs("tool-try", {
                item: "oko",
                part: `state:${s.value}`,
              }),
            }))}
          />
          <div class="relative mt-4 max-w-sm">
            {STATES.map((s) => (
              <img
                key={s.value}
                src={`/img/tools/oko/card-${s.value}.webp`}
                alt={s.alt}
                width={496}
                height={390}
                loading="lazy"
                decoding="async"
                data-oko-state={s.value}
                class="w-full h-auto rounded-xl"
              />
            ))}
            {MARKERS.map((m) => (
              <span
                key={m.n}
                class="absolute -translate-y-1/2"
                style={{ left: `${m.left}%`, top: `${m.top}%` }}
              >
                <Marker n={m.n} data-oko-marker={m.n} />
              </span>
            ))}
          </div>
          {STATES.map((s) => (
            <p
              key={s.value}
              data-oko-state={s.value}
              class="mt-3 max-w-sm text-sm text-graphite"
            >
              {s.note}
            </p>
          ))}
        </div>
        <div class="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <CodeBlock
            id="oko-config-entry"
            file="config.json (one service)"
            aside={
              <div aria-hidden="true" class="shrink-0 py-3 pr-4">
                {LINES.map((l, i) => (
                  <div key={i} class="flex h-6 items-center">
                    {l.field && <Marker n={l.field} />}
                  </div>
                ))}
              </div>
            }
          >
            {LINES.map((l, i) => (
              <span
                key={i}
                data-line={l.field}
                tabIndex={l.field ? 0 : undefined}
                class="block"
              >
                {l.text}
                {"\n"}
              </span>
            ))}
          </CodeBlock>
          <p class="mt-3 text-sm text-graphite">
            Change <code>config.json</code>{" "}
            and the next page load shows it. No restart, no database, no
            accounts.
          </p>
          <ol class="mt-6 grid gap-x-8 gap-y-3 text-sm text-graphite sm:grid-cols-2">
            {LEGEND.map((text, i) => (
              <li key={i} class="flex gap-3">
                <Marker n={i + 1} class="shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
