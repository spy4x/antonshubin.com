import { useSignal } from "@preact/signals"
import { Explorable } from "@spy4x/preact-ui/explorable"
import { Slider } from "@spy4x/preact-ui/slider"
import { Bars } from "@spy4x/preact-charts/bars"
import { trackPostTry } from "../lib/analytics.ts"
import {
  cachedCallRatio,
  cachedShareSentence,
  formatRatio,
} from "../lib/post-math.ts"

/** The post's own case: cached reads were three quarters of the bill. */
const CACHED_SHARE_DEFAULT = 75

/** The section of the post that the one-call note points at. */
const FEWER_CALLS = "#implementers-fewer-steps-beat-a-cheaper-token"

const CACHED = "Cached reads"
const REST = "Input, output, cache writes"

/**
 * The Opus 5.5 post's per-call figure (#537): one agent call priced on each
 * model, for the share of the bill that cached reads take. Cached reads cost
 * the same on both models and the rest twice as much on Opus, so the ratio
 * runs from 2× at no cached reads down to 1× when everything is cached. It
 * opens on the post's 75%; the reader's value never leaves the page.
 */
export default function CachedShareSlider({ post }: { post: string }) {
  const share = useSignal(CACHED_SHARE_DEFAULT)
  const s = share.value
  const cached = s / 100
  return (
    <Explorable
      id="per-call-price-figure"
      title="The same agent call, priced on each model"
      lead="Set cached reads to your own share of the bill."
      noScriptNote="Shown with the post's numbers. Turn on JavaScript to try others."
      caption="Cached reads cost $0.20 per million tokens on both models. Input, output and cache writes cost twice as much on Opus 5.5, so the ratio is 2 minus the cached share."
      controls={
        <Slider
          id="per-call-price-share"
          label="Cached reads, as a share of the bill"
          value={s}
          min={0}
          max={100}
          step={5}
          format={(v) => `${v}%`}
          marks={[
            // Unlabelled ticks: 7% apart, two labels overlap on a phone, so
            // the hint under the track says what each one is.
            { value: 68, label: "" },
            { value: 75, label: "" },
          ]}
          hint="The ticks: 68%, my six-hour window; 75%, the median Sonnet lane."
          onInput={(v) => {
            share.value = v
            trackPostTry(post, "CachedShareSlider")
          }}
        />
      }
    >
      <div class="flex flex-col gap-4">
        <p
          class="text-lg font-semibold text-parchment"
          aria-live="polite"
          data-result
        >
          {cachedShareSentence(s)}
        </p>
        <Bars
          ariaLabel="Cost of one call, against Sonnet 5"
          labelWidth="6rem"
          max={2}
          format={formatRatio}
          colors={["var(--color-rule-strong)", "var(--color-mist)"]}
          reference={{ value: 2, label: "List-price ratio" }}
          data={[
            {
              label: "Sonnet\u00a05",
              segments: [
                { series: CACHED, value: cached },
                { series: REST, value: 1 - cached },
              ],
            },
            {
              label: "Opus\u00a05.5",
              segments: [
                { series: CACHED, value: cached },
                { series: REST, value: cachedCallRatio(s) - cached },
              ],
            },
          ]}
        />
        <p class="text-sm text-graphite">
          This is one call. Opus 5.5 made{" "}
          <a href={FEWER_CALLS} class="text-parchment underline">
            fewer calls per changed line
          </a>, and that is where the saving came from.
        </p>
      </div>
    </Explorable>
  )
}
