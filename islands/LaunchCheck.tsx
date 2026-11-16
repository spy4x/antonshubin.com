import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import {
  CHECKS,
  DEFAULT_PASSES,
  launchScore,
  TOTALS,
  Verdict,
  Weight,
} from "../lib/launch-check.ts"

const GROUPS = [
  { weight: Weight.Stop, title: "Stop the launch if it fails" },
  { weight: Weight.Fix, title: "Fix this week if it fails" },
]

/**
 * The launch-check post's checklist. The founder ticks each check their app
 * passes; the result gives the post's verdict (launch, fix first, don't
 * launch) and names the failed checks. It opens on the post's example app.
 * The checkboxes sit in a fieldset that stays disabled until the island runs.
 * Nothing the reader ticks is sent, stored or put in the URL: the only event
 * is one `post-try`.
 */
export default function LaunchCheck({ post }: { post: string }) {
  const passes = useSignal<ReadonlySet<string>>(DEFAULT_PASSES)
  const live = useSignal(false)
  const fields = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    live.value = true
  }, [])
  const score = launchScore(passes.value)
  const failed = [...score.stops, ...score.fixes]
  const toggle = (id: string, on: boolean) => {
    const next = new Set(passes.value)
    if (on) next.add(id)
    else next.delete(id)
    passes.value = next
    trackPostTry(post, "LaunchCheck")
  }
  return (
    <Explorable
      id="launch-check-figure"
      live={live.value}
      title="Is your app safe to launch?"
      lead="Tick each check your app passes. Leave it unticked if it fails or you don't know."
      noScriptNote="Turn on JavaScript to tick the boxes. The checks above are the same list."
      caption="A self-check from this article, not an audit. Your ticks stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          ref={fields}
          disabled={!live.value}
          class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0 noscript:opacity-50"
        >
          {GROUPS.map((group) => (
            <fieldset key={group.weight} class="m-0 min-w-0 border-0 p-0">
              <legend class="mb-1 p-0 text-sm font-semibold text-parchment">
                {group.title}
              </legend>
              <ul role="list" class="flex flex-col">
                {CHECKS.filter((c) =>
                  c.weight === group.weight
                ).map((c) => (
                  <li key={c.id}>
                    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment">
                      <input
                        type="checkbox"
                        name={c.id}
                        checked={passes.value.has(c.id)}
                        onChange={(e) => toggle(c.id, e.currentTarget.checked)}
                        class="mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
                      />
                      <span>{c.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </fieldset>
        <div
          class="flex flex-col gap-3 border-t border-rule pt-5 text-sm text-parchment"
          aria-live="polite"
          data-result
        >
          <p class="price text-graphite">
            {`Stop-the-launch checks passed: ${score.passed.stop} of ${TOTALS.stop}. Fix-this-week checks passed: ${score.passed.fix} of ${TOTALS.fix}.`}
          </p>
          <p
            class={score.verdict === Verdict.DontLaunch
              ? "font-semibold text-brick"
              : "font-semibold"}
            data-verdict
          >
            {score.line}
          </p>
          {failed.length > 0 && (
            <p class="text-graphite" data-failed>
              {`Not passed yet: ${failed.join("; ")}.`}
            </p>
          )}
          <div>
            <Button
              class="min-h-11 px-4"
              disabled={!live.value || passes.value.size === 0}
              onClick={() => {
                passes.value = new Set()
                fields.current?.querySelector("input")?.focus()
              }}
            >
              Clear answers
            </Button>
          </div>
        </div>
      </div>
    </Explorable>
  )
}
