import { useSignal } from "@preact/signals"
import { Explorable } from "@spy4x/preact-ui/explorable"
import { Slider, type SliderMark } from "@spy4x/preact-ui/slider"
import { Bars } from "@spy4x/preact-charts/bars"
import { trackPostTry } from "../lib/analytics.ts"
import {
  formatCount,
  TASKS_LIMIT,
  tasksNeeded,
  tasksSentence,
} from "../lib/post-math.ts"

/** The calculator's props: the post's own case, and its saving marks. */
export interface RunsCalculatorProps {
  /** How much two identical runs differ, in %: the noise slider's start. */
  noise: number
  /** The saving to prove, in %: the saving slider's start. */
  saving: number
  /** How many tasks the post's own experiment ran. */
  experimentTasks: number
  /** Up to two labelled points on the saving slider. */
  marks?: SliderMark[]
  post: string
}

const percent = (v: number) => `${v}%`

/**
 * How many tasks a with-and-without test needs (#537): the reader sets how
 * much two identical runs differ and the saving they want to prove, and the
 * result compares the tasks that takes with the tasks in the post's own
 * experiment. It opens on the post's numbers; the formula and its fixed
 * settings sit in a closed "How this is calculated".
 */
export default function RunsCalculator(
  { noise: noiseStart, saving: savingStart, experimentTasks, marks, post }:
    RunsCalculatorProps,
) {
  const noise = useSignal(noiseStart)
  const saving = useSignal(savingStart)
  const n = tasksNeeded(noise.value, saving.value)
  const tried = () => trackPostTry(post, "RunsCalculator")
  return (
    <Explorable
      id="how-many-tasks-figure"
      title="How many tasks do you need?"
      lead="Each task runs twice: once without the tool, once with it."
      noScriptNote="Shown with the post's numbers. Turn on JavaScript to try others."
      controls={
        <div class="grid gap-6 sm:grid-cols-2">
          <Slider
            id="how-many-tasks-noise"
            label="How much two identical runs differ"
            value={noise.value}
            min={1}
            max={30}
            format={percent}
            onInput={(v) => {
              noise.value = v
              tried()
            }}
          />
          <Slider
            id="how-many-tasks-saving"
            label="The saving you want to prove"
            value={saving.value}
            min={1}
            max={50}
            format={percent}
            marks={marks}
            onInput={(v) => {
              saving.value = v
              tried()
            }}
          />
        </div>
      }
      caption={
        <details class="group">
          <summary class="cursor-pointer text-parchment underline-offset-4 hover:underline">
            How this is calculated
          </summary>
          <div class="mt-2 flex flex-col gap-2">
            <p>
              Confidence is fixed at 95% and power at 80%. If the tool does
              nothing, you'll wrongly see a saving at most 1 time in 20. If the
              saving is real, you'll see it 4 times in 5.
            </p>
            <p>
              Tasks = ⌈(2.8 × noise ÷ saving)² + 2⌉, never fewer than 3. The +2
              is the standard small-sample correction (Guenther), so the answer
              never claims a single task is enough.
            </p>
          </div>
        </details>
      }
    >
      <div class="flex flex-col gap-4">
        <p
          class="text-lg font-semibold text-parchment"
          aria-live="polite"
          data-result
        >
          {tasksSentence(noise.value, saving.value)}
        </p>
        <Bars
          ariaLabel="Tasks you need against tasks in my experiment"
          labelWidth="9.5rem"
          format={(v) =>
            v > TASKS_LIMIT ? `${formatCount(TASKS_LIMIT)}+` : formatCount(v)}
          colors={["var(--color-mist)", "var(--color-rule-strong)"]}
          data={[
            {
              label: "Tasks\u00a0you\u00a0need",
              value: Math.min(n, TASKS_LIMIT + 1),
              color: "var(--color-mist)",
            },
            {
              label: "Tasks in my\u00a0experiment",
              value: experimentTasks,
              color: "var(--color-rule-strong)",
            },
          ]}
        />
      </div>
    </Explorable>
  )
}
