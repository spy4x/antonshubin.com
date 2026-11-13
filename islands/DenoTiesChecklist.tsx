import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import { DENO_TIES, denoTiesResult, SEED_TIES } from "../lib/deno-ties.ts"

/** Renders the table's text, with each `backticked` part as code. */
function Text({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 === 1 ? <code key={i}>{part}</code> : part
      )}
    </>
  )
}

/**
 * The Deno post's table as a checklist (#597). The reader ticks what their
 * project uses; the result lists what replaced each ticked item in Seed. It
 * starts with Seed's own ticks, as the table above it describes. The boxes
 * sit in a fieldset that stays disabled until the island runs.
 */
export default function DenoTiesChecklist({ post }: { post: string }) {
  const ticked = useSignal<ReadonlySet<string>>(SEED_TIES)
  const live = useSignal(false)
  useEffect(() => {
    live.value = true
  }, [])
  const result = denoTiesResult(ticked.value)
  const set = (next: ReadonlySet<string>) => {
    ticked.value = next
    trackPostTry(post, "DenoTiesChecklist")
  }
  const toggle = (id: string, on: boolean) => {
    const next = new Set(ticked.value)
    if (on) next.add(id)
    else next.delete(id)
    set(next)
  }
  return (
    <Explorable
      id="deno-ties-figure"
      live={live.value}
      title="How tied to Deno is your project?"
      lead="Tick what your project uses. It starts with Seed's own ticks."
      noScriptNote="Turn on JavaScript to tick the boxes. The table above has every row."
      caption="What replaced each item in Seed, not advice on your code. Your ticks stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          disabled={!live.value}
          class="m-0 min-w-0 border-0 p-0 noscript:opacity-50"
        >
          <legend class="sr-only">What your project uses</legend>
          <ul role="list" class="grid gap-x-6 sm:grid-cols-2">
            {DENO_TIES.map((t) => (
              <li key={t.id}>
                <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment">
                  <input
                    type="checkbox"
                    name={t.id}
                    checked={ticked.value.has(t.id)}
                    onChange={(e) => toggle(t.id, e.currentTarget.checked)}
                    class="mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
                  />
                  <span>
                    <Text text={t.label} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div
          class="flex flex-col gap-3 border-t border-rule pt-5 text-sm text-parchment"
          data-result
        >
          <p class="font-semibold" aria-live="polite">{result.summary}</p>
          {result.rows.length > 0 && (
            <dl class="flex flex-col gap-3">
              {result.rows.map((t) => (
                <div key={t.id}>
                  <dt class="font-semibold">
                    <Text text={t.label} />
                  </dt>
                  <dd class="m-0 text-graphite">
                    <Text text={t.inSeed} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <div class="flex flex-wrap gap-3">
            <Button
              class="min-h-11 px-4"
              disabled={!live.value || ticked.value.size === 0}
              onClick={() => set(new Set())}
            >
              Clear answers
            </Button>
            <Button
              class="min-h-11 px-4"
              disabled={!live.value}
              onClick={() => set(SEED_TIES)}
            >
              Show Seed's ticks
            </Button>
          </div>
        </div>
      </div>
    </Explorable>
  )
}
