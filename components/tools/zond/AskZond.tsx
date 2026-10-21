import type { ComponentChildren } from "preact";
import { RadioChips } from "@spy4x/preact-ui/radio-chips";
import { eventAttrs } from "../../../lib/analytics.ts";

// "Ask zond" (#462): the visitor sets what each service answers and which URL
// the monitor asks, and reads what zond replies. Built only from zond's
// documented contract (README, docs/api.md, internal/probe/probe.go): 2xx and
// 3xx are up, any other status or any error is down, `/health` is 503 when one
// target is down, and an unknown name is 404. Every possible answer is server
// HTML; the page's own `<style>` shows the right one with `:has()`, so it
// works without JavaScript and ships no island.

/** The targets of zond.example.yml, with the timeout each one waits. */
export const SERVICES = [
  { name: "metube", timeout: 5000 },
  { name: "ollama", timeout: 10000 },
  { name: "grafana", timeout: 3000 },
] as const;

type Service = typeof SERVICES[number]["name"];

const WHY = {
  redirect: (
    <>
      Redirects are healthy. zond never follows them: a <code>302</code> to{" "}
      <code>/login</code> is up.
    </>
  ),
  http: (
    <>
      A service that listens but answers <code>4xx</code> or <code>5xx</code>
      {" "}
      counts as down.
    </>
  ),
  error: <>Any error, a timeout or a refused connection, counts as down.</>,
};

/** What a service can answer zond with, and whether zond counts it as down. */
export const ANSWERS = [
  { value: "ok", label: () => "200 OK", down: false },
  {
    value: "redirect",
    label: () => "302 redirect to /login",
    down: false,
    why: WHY.redirect,
  },
  {
    value: "notfound",
    label: () => "404 Not found",
    down: true,
    why: WHY.http,
  },
  {
    value: "error",
    label: () => "500 Server error",
    down: true,
    why: WHY.http,
  },
  {
    value: "timeout",
    label: (ms: number) => `No answer within its timeout (${ms} ms)`,
    down: true,
    why: WHY.error,
  },
  {
    value: "refused",
    label: () => "Connection refused",
    down: true,
    why: WHY.error,
  },
] as const;

/** The first render: one KO, so a reader who never touches a control still sees a 503. */
export const DEFAULT_ANSWERS: Record<Service, string> = {
  metube: "ok",
  ollama: "redirect",
  grafana: "error",
};

/** What the monitor can ask: each target, all of them, and a name not in the config. */
export const REQUESTS = [
  ...SERVICES.map((s) => ({ id: s.name, path: `/health/${s.name}` })),
  { id: "all", path: "/health" },
  { id: "jellyfin", path: "/health/jellyfin" },
];

const DEFAULT_REQUEST = "all";

const R = "[data-zond-sim]";
const down = (s: Service) => `#zond-a-${s} option[data-down]:checked`;
const anyDown = SERVICES.map((s) => down(s.name)).join(",");

/**
 * The rules that show one answer: a hidden default, then one rule per
 * condition, each on its own so one selector a browser rejects cannot drop
 * the others. No quotes and no `>`, so the text needs no escaping.
 */
const CSS = [
  `${R} [data-resp],${R} [data-if]{display:none}`,
  ...[
    ...REQUESTS.map((q) =>
      `${R}:has(#zond-q-${q.id}:checked) [data-resp=${q.id}]`
    ),
    ...SERVICES.flatMap(({ name: s }) => [
      `${R}:has(${down(s)}) [data-if~=${s}-down]`,
      `${R}:not(:has(${down(s)})) [data-if~=${s}-up]`,
      ...ANSWERS.map((a) =>
        `${R}:has(#zond-a-${s} option[value=${a.value}]:checked) [data-if~=${s}-${a.value}]`
      ),
    ]),
    `${R}:has(${anyDown}) [data-if~=any-down]`,
    `${R}:not(:has(${anyDown})) [data-if~=all-up]`,
  ].map((selector) => `${selector}{display:revert-layer}`),
].join("\n");

/** One line of the answer, shown only under `when` (space-separated conditions). */
function Line(
  { when, children }: { when?: string; children: ComponentChildren },
) {
  return <span data-if={when}>{children}{NL}</span>;
}

/** The "Why" sentence under the answer, shown only under `when`. */
function Why(
  { when, children }: { when: string; children: ComponentChildren },
) {
  return (
    <span data-if={when} class="mt-3 block text-graphite leading-relaxed">
      {children}
    </span>
  );
}

const NL = "\n";
const STATUS_200 = "HTTP/1.1 200 OK";
const STATUS_503 = "HTTP/1.1 503 Service Unavailable";
const CONTENT_TYPE = "Content-Type: text/plain; charset=utf-8";

/** zond's reply to `/health/<name>` for one target. */
function OneTarget({ name }: { name: Service }) {
  return (
    <>
      <Line when={`${name}-up`}>{STATUS_200}</Line>
      <Line when={`${name}-down`}>{STATUS_503}</Line>
      {CONTENT_TYPE}
      {"\n\n"}
      <Line when={`${name}-up`}>ok</Line>
      <Line when={`${name}-down`}>unreachable</Line>
    </>
  );
}

/** zond's reply to `/health`: one OK or KO line per target, 503 if any is down. */
function AllTargets() {
  return (
    <>
      <Line when="all-up">{STATUS_200}</Line>
      <Line when="any-down">{STATUS_503}</Line>
      {CONTENT_TYPE}
      {"\n\n"}
      {SERVICES.map(({ name }) => (
        <span key={name}>
          <Line when={`${name}-up`}>OK {name}</Line>
          <Line when={`${name}-down`}>
            <span class="text-brick">KO</span> {name}
          </Line>
        </span>
      ))}
    </>
  );
}

/** The "Why" lines of one target's answer, by what it answered. */
function TargetWhy({ name }: { name: Service }) {
  const by = (why: ComponentChildren) =>
    ANSWERS.filter((a) => "why" in a && a.why === why)
      .map((a) => `${name}-${a.value}`).join(" ");
  return (
    <>
      <Why when={by(WHY.redirect)}>{WHY.redirect}</Why>
      <Why when={by(WHY.http)}>{WHY.http}</Why>
      <Why when={by(WHY.error)}>{WHY.error}</Why>
    </>
  );
}

/** "Ask zond", the page's own middle: the controls and zond's answer. */
export function AskZond() {
  const controls = [
    ...SERVICES.map((s) => `zond-a-${s.name}`),
    ...REQUESTS.map((q) => `zond-q-${q.id}`),
  ].join(" ");
  return (
    <section aria-labelledby="ask-zond" data-zond-sim>
      <style>{CSS}</style>
      <h2 id="ask-zond" class="text-2xl text-parchment">Ask zond</h2>
      <p class="mt-3 max-w-3xl text-graphite leading-relaxed">
        Set what each service answers, pick what your monitor asks, and read
        zond's reply.
      </p>
      <div class="mt-6 grid gap-6 lg:grid-cols-12">
        <div class="space-y-6 rounded-lg border border-rule bg-paper p-5 lg:col-span-5">
          <fieldset>
            <legend class="font-semibold text-parchment">
              Your services answer zond with
            </legend>
            <div class="mt-3 space-y-3">
              {SERVICES.map(({ name, timeout }) => (
                <div
                  key={name}
                  class="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3"
                >
                  <label
                    for={`zond-a-${name}`}
                    class="font-mono text-sm text-parchment"
                  >
                    <span class="sr-only">What</span> {name}{" "}
                    <span class="sr-only">answers zond with</span>
                  </label>
                  <select
                    id={`zond-a-${name}`}
                    class="min-h-11 w-full min-w-0 rounded-lg border border-rule-strong bg-lamp px-3 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-parchment"
                  >
                    {ANSWERS.map((a) => (
                      <option
                        key={a.value}
                        value={a.value}
                        selected={DEFAULT_ANSWERS[name] === a.value}
                        data-down={a.down ? "" : undefined}
                      >
                        {a.label(timeout)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
          <RadioChips
            legend="Your monitor asks"
            legendClass="font-semibold text-parchment"
            name="zond-q"
            defaultValue={DEFAULT_REQUEST}
            optionsClass="mt-3"
            options={REQUESTS.map((q) => ({
              value: q.id,
              id: `zond-q-${q.id}`,
              label: <span class="font-mono">{q.path}</span>,
              inputAttributes: eventAttrs("tool-try", {
                item: "zond",
                part: `ask:${q.path}`,
              }),
            }))}
          />
        </div>
        <div class="min-w-0 rounded-lg border border-rule bg-paper p-5 lg:col-span-7">
          <p id="zond-answer-label" class="font-semibold text-parchment">
            zond answers
          </p>
          <output
            for={controls}
            aria-labelledby="zond-answer-label"
            class="mt-3 block text-sm"
          >
            {REQUESTS.map((q) => (
              <span key={q.id} data-resp={q.id} class="block">
                <code class="block whitespace-pre-wrap break-words leading-relaxed text-parchment">
                  <span class="text-graphite">
                    $ curl -i https://zond.example.com{q.path}
                  </span>
                  {"\n"}
                  {q.id === "all" ? <AllTargets /> : q.id === "jellyfin"
                    ? (
                      <>
                        {"HTTP/1.1 404 Not Found\n"}
                        {CONTENT_TYPE}
                        {"\n\nunknown target: jellyfin"}
                      </>
                    )
                    : <OneTarget name={q.id as Service} />}
                </code>
                {q.id === "all"
                  ? (
                    <>
                      <Why when="any-down">
                        One service down makes <code>/health</code> answer{" "}
                        <code>503</code>.
                      </Why>
                      <Why when="all-up">
                        Every target is up, so <code>/health</code> answers{" "}
                        <code>200</code>.
                      </Why>
                    </>
                  )
                  : q.id === "jellyfin"
                  ? (
                    <span class="mt-3 block text-graphite leading-relaxed">
                      <code>jellyfin</code> is not in{" "}
                      <code>zond.yml</code>, so zond answers <code>404</code>.
                    </span>
                  )
                  : <TargetWhy name={q.id as Service} />}
              </span>
            ))}
          </output>
          <p class="mt-4 border-t border-rule pt-4 text-sm text-graphite leading-relaxed">
            Answers are <code>ok</code>, <code>unreachable</code>{" "}
            and target names. No internal URLs, no response bodies, no tokens.
          </p>
        </div>
      </div>
    </section>
  );
}
