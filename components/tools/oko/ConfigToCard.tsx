import { RadioChips } from "@spy4x/preact-ui/radio-chips";
import { eventAttrs } from "../../../lib/analytics.ts";
import { CodeBlock } from "./CodeBlock.tsx";

/** One state a card can be in, with its real crop from the staged oko (scripts/clips/oko/cards.ts). */
interface CardState {
  value: "up" | "down" | "unknown";
  label: string;
  note: string;
  alt: string;
  /** Shown before any choice: the "Up" picture. */
  initial: boolean;
  /** Shows the picture and the note while this state's radio is checked (literal, so Tailwind sees it). */
  show: string;
}

const STATES: CardState[] = [
  {
    value: "up",
    label: "Up",
    note: "Up, down and 30-day uptime come from gatus.",
    alt:
      "An oko card for Audiobooks, up, with a 30-day uptime pill reading 90.32%.",
    initial: true,
    show:
      "group-has-[#oko-state-down:checked]:hidden group-has-[#oko-state-unknown:checked]:hidden",
  },
  {
    value: "down",
    label: "Down",
    note: "The card gets a red border and keeps its 30-day uptime from gatus.",
    alt:
      "An oko card for Audiobooks, down: a red border, and a grey pill reading 80.00%.",
    initial: false,
    show: "group-has-[#oko-state-down:checked]:block",
  },
  {
    value: "unknown",
    label: "Gatus didn't answer",
    note:
      'When gatus gives no answer for a service, the card gets a dashed "unknown" marker instead of a red border, and the section counter reports it separately. Failed upstream is not the same as failed service.',
    alt:
      "An oko card for Audiobooks with a dashed border and an unknown marker instead of an uptime pill.",
    initial: false,
    show: "group-has-[#oko-state-unknown:checked]:block",
  },
];

/**
 * A field's number on the card and in the JSON: where its marker sits on
 * the crop (percent, so it scales), and the outline it gets while its JSON
 * line is hovered. Every class is written out so Tailwind sees it.
 */
const MARKERS = [
  {
    n: 1,
    at: "left-[19%] top-[46%]",
    lit: "group-has-[[data-line='1']:hover]:outline-2",
  },
  {
    n: 2,
    at: "left-[4%] top-[9%]",
    lit: "group-has-[[data-line='2']:hover]:outline-2",
  },
  {
    n: 3,
    at: "left-[33%] top-[27%]",
    lit: "group-has-[[data-line='3']:hover]:outline-2",
  },
  {
    n: 4,
    at: "left-[7%] top-[62%]",
    lit: "group-has-[[data-line='4']:hover]:outline-2",
  },
  {
    n: 5,
    at: "left-[17%] top-[84%]",
    lit: "group-has-[[data-line='5']:hover]:outline-2",
  },
  {
    n: 6,
    at: "left-[57%] top-[17%]",
    lit: "group-has-[[data-line='6']:hover]:outline-2",
  },
];

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
];

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
];

/** A small numbered circle; decorative, the legend carries the meaning. */
function Marker({ n, class: extra = "" }: { n: number; class?: string }) {
  return (
    <span
      aria-hidden="true"
      class={`grid size-5 place-items-center rounded-full bg-parchment text-xs font-semibold text-ink outline-offset-2 outline-sage ${extra}`}
    >
      {n}
    </span>
  );
}

/**
 * oko's page, part 4 (#464): "From config to card". A `config.json` entry
 * beside the card oko renders from it, with numbered markers on both and a
 * numbered legend; the library's `RadioChips` (native radios) swap the card between its real up,
 * down and unknown crops. No island: the swap is CSS `:has()`, and the two
 * hidden pictures are `display: none` with `loading="lazy"`, so the browser
 * fetches each only once it is chosen. Hovering a JSON line outlines its
 * marker on the card.
 */
export function ConfigToCard() {
  return (
    <section aria-labelledby="config-to-card" class="group">
      <h2 id="config-to-card" class="text-2xl sm:text-3xl text-parchment">
        From config to card
      </h2>
      <div class="mt-6 grid gap-8 lg:grid-cols-12 lg:items-start">
        <div class="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1">
          <RadioChips
            legend="What gatus says"
            legendClass="mb-2 text-sm text-graphite"
            name="oko-card-state"
            defaultValue="up"
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
                class={`w-full h-auto rounded-xl ${
                  s.initial ? "block" : "hidden"
                } ${s.show}`}
              />
            ))}
            {MARKERS.map((m) => (
              <span key={m.n} class={`absolute -translate-y-1/2 ${m.at}`}>
                <Marker n={m.n} class={m.lit} />
              </span>
            ))}
          </div>
          {STATES.map((s) => (
            <p
              key={s.value}
              class={`mt-3 max-w-sm text-sm text-graphite ${
                s.initial ? "block" : "hidden"
              } ${s.show}`}
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
                class="block hover:bg-lamp"
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
  );
}
