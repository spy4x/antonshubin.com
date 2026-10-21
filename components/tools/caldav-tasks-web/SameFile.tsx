import { RadioChips } from "@spy4x/preact-ui/radio-chips";
import { FACT_LINK } from "../../FactCard.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import { fieldOf, TASK_FIELDS, TASK_FILE } from "./data.ts";

const SLUG = "caldav-tasks-web";
const COMPATIBILITY =
  "https://github.com/spy4x/caldav-tasks-web/blob/main/docs/compatibility.md#which-tasksorg-fields-round-trip";

/**
 * The switch's whole behaviour, in CSS (no island): while a field's radio is
 * checked, the file lines marked with its id get the Lamp fill, a Parchment
 * rule and Parchment text (the rest is Graphite), and only its note shows.
 * It is a page-only `<style>`, not Tailwind classes, so the shared stylesheet
 * every page loads carries none of it (#465: 3.4 KB there slowed the home
 * page's LCP). Fresh gives the element the render's CSP nonce.
 */
const SWITCH_CSS = TASK_FIELDS.map(({ id }) => {
  const on = `[data-same-file]:has(#ctw-field-${id}:checked)`;
  return `${on} [data-line~=${id}]{background-color:var(--color-lamp);` +
    `border-color:var(--color-parchment);color:var(--color-parchment)}` +
    `${on} [data-note]:not([data-note=${id}]){display:none}`;
}).join("");

/**
 * A compatibility.md cell: text with its `backtick` spans as `<code>`. Plain
 * parts go in a `<span>` too: a bare string in a keyed list came out escaped
 * twice (`&amp;quot;`).
 */
function Cell({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2
          ? <code key={i} class="text-parchment">{part}</code>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/**
 * "Same file, two apps" (#465): the made-up "Buy seeds" task as Tasks.org
 * writes it, beside the fields Tasks.org shows. Picking a field lights its
 * lines in the file and shows what compatibility.md says about it. The
 * library's `RadioChips` (native radios) plus CSS, so it works without
 * JavaScript.
 */
export function SameFile() {
  return (
    <section
      aria-labelledby="same-file"
      data-same-file
      class="max-w-5xl"
    >
      <style>{SWITCH_CSS}</style>
      <h2 id="same-file" class="text-2xl sm:text-3xl text-parchment">
        Same file, two apps
      </h2>
      <p class="mt-3 max-w-3xl text-graphite leading-relaxed">
        The server only relays. Your tasks stay on your CalDAV server, and the
        app writes them back in the form Tasks.org wrote them, so nothing the
        phone stored is lost when you edit in the browser.
      </p>
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div class="min-w-0">
          <RadioChips
            legend="Pick a field Tasks.org shows"
            legendClass="text-parchment font-semibold"
            name="ctw-field"
            defaultValue={TASK_FIELDS[0].id}
            optionsClass="mt-3 lg:flex-col lg:items-start"
            options={TASK_FIELDS.map((f) => ({
              value: f.id,
              label: f.label,
              id: `ctw-field-${f.id}`,
              inputAttributes: eventAttrs("tool-try", {
                item: SLUG,
                part: `field:${f.id}`,
              }),
            }))}
          />
          {TASK_FIELDS.map((f) => (
            <dl
              key={f.id}
              data-note={f.id}
              class="mt-5 space-y-3 text-sm text-graphite"
            >
              <div>
                <dt class="font-semibold text-parchment">In the file</dt>
                <dd class="mt-1">
                  <Cell text={f.inFile} />
                </dd>
              </div>
              <div>
                <dt class="font-semibold text-parchment">
                  Covered by the fixtures and tests
                </dt>
                <dd class="mt-1">
                  <Cell text={f.covered} />
                </dd>
              </div>
            </dl>
          ))}
        </div>
        <figure class="min-w-0">
          <figcaption class="text-sm text-graphite">
            <code class="text-parchment">Buy seeds.ics</code>{" "}
            · a made-up task in Tasks.org's form
          </figcaption>
          <pre
            tabIndex={0}
            aria-label="Buy seeds.ics"
            class="mt-2 overflow-x-auto rounded-xl border border-rule bg-paper py-3 text-sm leading-6 text-parchment"
          ><code>{TASK_FILE.map((line) => (
            <span
              key={line}
              data-line={fieldOf(line)}
              class="block border-l-4 border-transparent px-4 text-graphite"
            >
              {line}
            </span>
          ))}</code></pre>
        </figure>
      </div>
      <p class="mt-5 text-graphite">
        An edit in the browser leaves the rest of the text as it was.{" "}
        <a
          href={COMPATIBILITY}
          {...eventAttrs("outbound", {
            to: "github",
            item: SLUG,
            place: "body",
          })}
          class={FACT_LINK}
        >
          Every field
        </a>
      </p>
    </section>
  );
}
