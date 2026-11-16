import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { Explorable } from "@spy4x/preact-ui/explorable"
import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import Button from "../components/Button.tsx"
import { trackPostTry } from "../lib/analytics.ts"
import {
  GROUP_TITLES,
  PROMPT,
  QUESTIONS,
  type QuizAnswer,
  type QuizGroup,
  quizResult,
} from "../lib/developer-need-quiz.ts"

const GROUPS: QuizGroup[] = ["stake", "warning"]
const OPTIONS: { value: QuizAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

/**
 * The "do you need a developer" post's quiz. Each question is a native
 * Yes/No radio group (the library's `RadioChips`), inside a fieldset that
 * stays disabled until the island runs; the verdict follows the post's rules
 * in `lib/developer-need-quiz.ts`. Nothing the reader picks is sent, stored
 * or put in the URL: the only event is one `post-try`.
 */
export default function DeveloperNeedQuiz({ post }: { post: string }) {
  const answers = useSignal<Readonly<Record<string, QuizAnswer>>>({})
  const live = useSignal(false)
  const fields = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    live.value = true
  }, [])
  const result = quizResult(answers.value)
  const answer = (id: string, value: string) => {
    answers.value = { ...answers.value, [id]: value as QuizAnswer }
    trackPostTry(post, "DeveloperNeedQuiz")
  }
  return (
    <Explorable
      id="developer-need-quiz-figure"
      live={live.value}
      title="Do I need a developer yet?"
      lead="Answer for the app you have today, not the one you plan."
      noScriptNote="Turn on JavaScript to answer. The questions and the rules are in the text above."
      caption="A rule of thumb from this article, not an audit. Your answers stay in this page."
    >
      <div class="flex flex-col gap-6">
        <fieldset
          ref={fields}
          disabled={!live.value}
          class="m-0 grid min-w-0 gap-6 border-0 p-0 noscript:opacity-50 md:grid-cols-2"
        >
          {GROUPS.map((group) => (
            <fieldset key={group} class="m-0 min-w-0 border-0 p-0">
              <legend class="mb-2 p-0 text-sm font-semibold text-parchment">
                {GROUP_TITLES[group]}
              </legend>
              <div class="flex flex-col gap-4">
                {QUESTIONS.filter((q) =>
                  q.group === group
                ).map((q) => (
                  <RadioChips
                    key={q.id}
                    legend={q.label}
                    legendClass="mb-2 p-0 text-sm text-parchment"
                    class="m-0 min-w-0 border-0 p-0"
                    name={`developer-need-${q.id}`}
                    value={answers.value[q.id] ?? null}
                    onChange={(value) => answer(q.id, value)}
                    options={OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                      disabled: !live.value,
                    }))}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </fieldset>
        <div
          class="flex min-h-40 flex-col gap-3 border-t border-rule pt-5 text-sm text-parchment"
          aria-live="polite"
          data-result
        >
          <p class="price text-graphite">
            {`Answered ${result.answered} of ${QUESTIONS.length}.`}
          </p>
          {result.verdict
            ? (
              <div data-verdict={result.verdict.id}>
                <p class="font-semibold" data-verdict-title>
                  {result.verdict.title}
                </p>
                <p class="mt-1 text-graphite">{result.verdict.text}</p>
              </div>
            )
            : <p data-verdict="none" data-verdict-title>{PROMPT}</p>}
          <div>
            <Button
              class="min-h-11 px-4"
              disabled={!live.value || result.answered === 0}
              onClick={() => {
                answers.value = {}
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
