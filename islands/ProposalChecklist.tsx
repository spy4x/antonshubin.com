import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import {
  GREEN_FLAGS,
  type ProposalFlag,
  proposalScore,
  RED_FLAGS,
} from "../lib/proposal-checklist.ts"

const GROUPS: { key: "red" | "green"; title: string; flags: ProposalFlag[] }[] =
  [
    { key: "red", title: "Red flags", flags: [...RED_FLAGS] },
    { key: "green", title: "Green flags", flags: [...GREEN_FLAGS] },
  ]

/**
 * The takeover post's red-flag checklist. The founder ticks the post's own
 * red and green flags for one proposal they received; the result counts each
 * kind and shows the post's verdict line for that count. The checkboxes sit
 * in a fieldset that stays disabled until the island runs. Nothing the reader
 * ticks is sent, stored or put in the URL: the only event is one `post-try`.
 */
export default function ProposalChecklist({ post }: { post: string }) {
  const ticked = useSignal<ReadonlySet<string>>(new Set())
  const live = useSignal(false)
  useEffect(() => {
    live.value = true
  }, [])
  const score = proposalScore(ticked.value)
  const toggle = (id: string, on: boolean) => {
    const next = new Set(ticked.value)
    if (on) next.add(id)
    else next.delete(id)
    ticked.value = next
    trackPostTry(post, "ProposalChecklist")
  }
  return (
    <Explorable
      id="proposal-checklist-figure"
      live={live.value}
      title="Score a proposal you received"
      lead="Open one proposal next to this and tick what it does."
      noScriptNote="Turn on JavaScript to tick the boxes. The red and green flags above are the same checklist."
      caption="A rule of thumb from this article, not a verdict on a person. Your ticks stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          disabled={!live.value}
          class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0 noscript:opacity-50"
        >
          {GROUPS.map((group) => (
            <fieldset key={group.key} class="m-0 min-w-0 border-0 p-0">
              <legend class="mb-1 p-0 text-sm font-semibold text-parchment">
                {group.title}
              </legend>
              <ul role="list" class="flex flex-col">
                {group.flags.map((flag) => (
                  <li key={flag.id}>
                    <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-parchment">
                      <input
                        type="checkbox"
                        name={flag.id}
                        checked={ticked.value.has(flag.id)}
                        onChange={(e) =>
                          toggle(flag.id, e.currentTarget.checked)}
                        class="mt-0.5 size-5 shrink-0 cursor-pointer accent-parchment [color-scheme:dark] disabled:cursor-not-allowed"
                      />
                      <span>{flag.label}</span>
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
            {`Red flags: ${score.red.length} of ${RED_FLAGS.length}. Green flags: ${score.green.length} of ${GREEN_FLAGS.length}.`}
          </p>
          <p
            class={score.red.length > 0
              ? "font-semibold text-brick"
              : "font-semibold"}
            data-verdict
          >
            {score.verdict}
          </p>
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
