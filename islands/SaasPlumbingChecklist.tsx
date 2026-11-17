import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import {
  DEFAULT_TICKS,
  missingLine,
  PARTS,
  plumbingScore,
} from "../lib/saas-plumbing.ts"

/**
 * The Seed founders post's checklist. The reader ticks what their product
 * needs; the result says how many of those parts Seed already ships, how many
 * working days they take from scratch, and lists the ones it doesn't. It
 * opens with the post's own case ticked. The checkboxes sit in a fieldset that
 * stays disabled until the island runs.
 * Nothing the reader ticks is sent, stored or put in the URL: the only event
 * is one `post-try`.
 */
export default function SaasPlumbingChecklist({ post }: { post: string }) {
  const ticked = useSignal<ReadonlySet<string>>(DEFAULT_TICKS)
  const live = useSignal(false)
  const fields = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    live.value = true
  }, [])
  const score = plumbingScore(ticked.value)
  const toggle = (id: string, on: boolean) => {
    const next = new Set(ticked.value)
    if (on) next.add(id)
    else next.delete(id)
    ticked.value = next
    trackPostTry(post, "SaasPlumbingChecklist")
  }
  return (
    <Explorable
      id="plumbing-checklist-figure"
      live={live.value}
      title="What does your product need?"
      lead="Tick every part your product needs, the plumbing and your own feature."
      noScriptNote="Turn on JavaScript to tick the boxes. The lists above say which parts Seed ships."
      caption="Every part marked as in Seed is in its README today. The days are my estimates. Your ticks stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          ref={fields}
          disabled={!live.value}
          class="m-0 flex min-w-0 flex-col border-0 p-0 noscript:opacity-50"
        >
          <legend class="mb-1 p-0 text-sm font-semibold text-parchment">
            Your product needs
          </legend>
          <ul role="list" class="flex flex-col">
            {PARTS.map((p) => (
              <li key={p.id}>
                <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment">
                  <input
                    type="checkbox"
                    name={p.id}
                    checked={ticked.value.has(p.id)}
                    onChange={(e) => toggle(p.id, e.currentTarget.checked)}
                    class="mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
                  />
                  <span>{p.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div
          class="flex flex-col gap-3 border-t border-rule pt-5 text-sm text-parchment"
          aria-live="polite"
          data-result
        >
          <p class="font-semibold" data-summary>{score.summary}</p>
          {score.missing.length > 0 && (
            <p class="text-graphite" data-missing>
              {missingLine(score.missing)}
            </p>
          )}
          <div>
            <Button
              class="min-h-11 px-4"
              disabled={!live.value || ticked.value.size === 0}
              onClick={() => {
                ticked.value = new Set()
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
