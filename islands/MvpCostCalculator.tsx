import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import { trackPostTry } from "../lib/analytics.ts"
import {
  CORE_SIZES,
  DEFAULT_INPUT,
  estimate,
  estimateLine,
  EXTRAS,
  RATES,
} from "../lib/mvp-cost.ts"

const LABEL =
  "flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment"
const INPUT =
  "mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
const LEGEND = "mb-1 p-0 text-sm font-semibold text-parchment"

/**
 * The SaaS MVP cost post's calculator. The reader picks the core feature's
 * size, ticks extras, says whether the build starts from a SaaS starter and
 * picks a rate; the result shows weeks and dollars from `lib/mvp-cost.ts`.
 * The server renders the post's default case with the controls disabled, so
 * nothing shifts when it hydrates. Nothing the reader picks is sent, stored
 * or put in the URL: the only event is one `post-try`.
 */
export default function MvpCostCalculator({ post }: { post: string }) {
  const core = useSignal(DEFAULT_INPUT.core)
  const extras = useSignal<ReadonlySet<string>>(DEFAULT_INPUT.extras)
  const starter = useSignal(DEFAULT_INPUT.starter)
  const rate = useSignal(DEFAULT_INPUT.rate)
  const live = useSignal(false)
  useEffect(() => {
    live.value = true
  }, [])
  const result = estimate({
    core: core.value,
    extras: extras.value,
    starter: starter.value,
    rate: rate.value,
  })
  const touched = () => trackPostTry(post, "MvpCostCalculator")
  const toggle = (id: string, on: boolean) => {
    const next = new Set(extras.value)
    if (on) next.add(id)
    else next.delete(id)
    extras.value = next
    touched()
  }
  return (
    <Explorable
      id="mvp-cost-figure"
      live={live.value}
      title="Price your own MVP"
      lead="Pick what your first version needs. The ranges are my rules of thumb, not a quote."
      noScriptNote="Turn on JavaScript to pick parts. The table above has every estimate."
      caption="One senior developer with AI tools, 8-hour days. Your picks stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          disabled={!live.value}
          class="m-0 grid min-w-0 gap-5 border-0 p-0 noscript:opacity-50 md:grid-cols-2"
        >
          <div class="flex flex-col gap-5">
            <fieldset class="m-0 min-w-0 border-0 p-0">
              <legend class={LEGEND}>Your core feature</legend>
              {CORE_SIZES.map((c) => (
                <label key={c.id} class={LABEL}>
                  <input
                    type="radio"
                    name="mvp-core"
                    value={c.id}
                    checked={core.value === c.id}
                    onChange={() => {
                      core.value = c.id
                      touched()
                    }}
                    class={INPUT}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset class="m-0 min-w-0 border-0 p-0">
              <legend class={LEGEND}>
                Sign-in, payments, admin and deploy
              </legend>
              {[
                { on: false, label: "Built from scratch" },
                { on: true, label: "From a SaaS starter" },
              ].map((o) => (
                <label key={o.label} class={LABEL}>
                  <input
                    type="radio"
                    name="mvp-starter"
                    checked={starter.value === o.on}
                    onChange={() => {
                      starter.value = o.on
                      touched()
                    }}
                    class={INPUT}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset class="m-0 min-w-0 border-0 p-0">
              <legend class={LEGEND}>Hourly rate</legend>
              <div class="flex flex-wrap gap-x-6">
                {RATES.map((r) => (
                  <label key={r.usd} class={LABEL}>
                    <input
                      type="radio"
                      name="mvp-rate"
                      value={r.usd}
                      checked={rate.value === r.usd}
                      onChange={() => {
                        rate.value = r.usd
                        touched()
                      }}
                      class={INPUT}
                    />
                    <span class="price">{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <fieldset class="m-0 min-w-0 border-0 p-0">
            <legend class={LEGEND}>Extras</legend>
            {EXTRAS.map((e) => (
              <label key={e.id} class={LABEL}>
                <input
                  type="checkbox"
                  name={e.id}
                  checked={extras.value.has(e.id)}
                  onChange={(ev) => toggle(e.id, ev.currentTarget.checked)}
                  class={INPUT}
                />
                <span>{e.label}</span>
              </label>
            ))}
          </fieldset>
        </fieldset>
        <div
          class="flex flex-col gap-2 border-t border-rule pt-5 text-sm"
          aria-live="polite"
          data-result
        >
          <p class="price text-lg font-semibold text-parchment" data-estimate>
            {estimateLine(result)}
          </p>
          <p class="price text-graphite">
            {`${result.days.low}–${result.days.high} working days.`}
            {starter.value
              ? ` The starter saved ${result.starterSaves.low}–${result.starterSaves.high} of them.`
              : ` A starter would save ${result.starterSaves.low}–${result.starterSaves.high}.`}
          </p>
        </div>
      </div>
    </Explorable>
  )
}
