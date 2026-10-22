import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import { IconExclamationCircle } from "@spy4x/preact-icons"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import {
  AVOID_LEAD,
  CHECKLIST,
  checklistMirror,
  MODEL_NAME,
} from "../lib/framework-checklist.ts"

/**
 * The cost laboratory post's framework as a checklist (#537). The reader
 * ticks the post's own bullets, grouped by steps 1–4, and the result below
 * mirrors the ticks back as the post's own sentences: which model's
 * conditions they match, the hybrid lines when both match, a danger line per
 * "What not to self-host" item, and step 5 always. No score and no winner.
 * The checkboxes sit in their own fieldset, disabled until the island runs,
 * so they come before the result they change instead of after it.
 */
export default function FrameworkChecklist({ post }: { post: string }) {
  const ticked = useSignal<ReadonlySet<string>>(new Set())
  const live = useSignal(false)
  useEffect(() => {
    live.value = true
  }, [])
  const mirror = checklistMirror(ticked.value)
  const toggle = (id: string, on: boolean) => {
    const next = new Set(ticked.value)
    if (on) next.add(id)
    else next.delete(id)
    ticked.value = next
    trackPostTry(post, "FrameworkChecklist")
  }
  return (
    <Explorable
      id="decision-framework-figure"
      live={live.value}
      title="Try the framework on your product"
      lead="Tick what is true for your product. Each can be correct."
      noScriptNote="Turn on JavaScript to tick the boxes. The five steps above are the same checklist."
      caption="This reflects only this article's general framework, not advice on your system. Your answers stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          disabled={!live.value}
          class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0 noscript:opacity-50"
        >
          {CHECKLIST.map((step) => (
            <fieldset key={step.step} class="m-0 min-w-0 border-0 p-0">
              <legend class="mb-1 p-0 text-sm font-semibold text-parchment">
                {`${step.step}. ${step.title}`}
              </legend>
              <ul role="list" class="flex flex-col">
                {step.items.map((item) => (
                  <li key={item.id}>
                    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment">
                      <input
                        type="checkbox"
                        name={item.id}
                        checked={ticked.value.has(item.id)}
                        onChange={(e) =>
                          toggle(item.id, e.currentTarget.checked)}
                        class="mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
                      />
                      <span>{item.label}</span>
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
          {(["managed", "dedicated"] as const).map((model) =>
            mirror[model].length > 0 && (
              <div key={model}>
                <p class="font-semibold">
                  Your ticks match these conditions for {MODEL_NAME[model]}:
                </p>
                <ul class="mt-1 list-disc pl-5 text-graphite">
                  {mirror[model].map((label) => <li key={label}>{label}</li>)}
                </ul>
              </div>
            )
          )}
          {mirror.hybrid.map((line) => <p key={line}>{line}</p>)}
          {mirror.avoid.map((label) => (
            <p key={label} class="flex items-start gap-2 text-brick">
              <IconExclamationCircle class="mt-0.5 size-4 shrink-0" />
              <span>{`${AVOID_LEAD} ${label}.`}</span>
            </p>
          ))}
          {mirror.noWorkload && <p>{mirror.noWorkload}</p>}
          <p class="text-graphite">{mirror.compare}</p>
          <div>
            <Button
              class="min-h-11 px-4"
              disabled={!live.value || ticked.value.size === 0}
              onClick={() => (ticked.value = new Set())}
            >
              Clear answers
            </Button>
          </div>
        </div>
      </div>
    </Explorable>
  )
}
