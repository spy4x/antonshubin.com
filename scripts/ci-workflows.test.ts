import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { parse } from "jsr:@std/yaml@^1.0.5"

interface Condition {
  event: string | string[]
  evaluate?: string
}
interface Workflow {
  when: Condition[]
  steps: Record<
    string,
    { when?: Condition | Condition[]; image: string; commands: string[] }
  >
}
type Step = Workflow["steps"][string]

const read = async (name: string) =>
  parse(
    await Deno.readTextFile(new URL(`../.woodpecker/${name}`, import.meta.url)),
  ) as Workflow
const full = await read("woodpecker.yml")
const wip = await read("wip.yml")
const on = (w: Workflow, event: string) =>
  w.when.find((c) => [c.event].flat().includes(event))
const runsOn = (s: Step, event: string) =>
  [s.when ?? []].flat().some((c) => [c.event].flat().includes(event))

Deno.test("a pull request runs exactly one of the two workflows", () => {
  const isWip = on(wip, "pull_request")?.evaluate
  assertEquals(isWip, 'CI_COMMIT_MESSAGE startsWith "[WIP]"')
  assertEquals(on(full, "pull_request")?.evaluate, `not (${isWip})`)
  assertEquals(wip.when.length, 1)
})

Deno.test("removing [WIP] from the title starts the full workflow", () => {
  const isWip = on(wip, "pull_request")?.evaluate
  assertEquals(
    on(full, "pull_request_metadata")?.evaluate,
    `CI_PIPELINE_EVENT_REASON contains "edited" && not (${isWip})`,
  )
})

Deno.test("every full step that runs on pull_request runs on a title edit too", () => {
  const prSteps = Object.entries(full.steps).filter(([, s]) =>
    runsOn(s, "pull_request")
  )
  assert(prSteps.length > 1, "no step runs on pull_request")
  for (const [name, step] of prSteps) {
    assert(
      runsOn(step, "pull_request_metadata"),
      `${name} skips pull_request_metadata`,
    )
  }
})

Deno.test("a push to main runs only build and unit", () => {
  const pushSteps = Object.keys(full.steps).filter((name) =>
    runsOn(full.steps[name], "push")
  )
  assertEquals(pushSteps, ["build", "unit"])
})

Deno.test("the WIP workflow runs no browser, video-cut or Lighthouse step", () => {
  assertEquals(Object.keys(wip.steps), ["check"])
  const { image, commands } = wip.steps.check
  assert(image.startsWith("denoland/deno:"), image)
  const run = commands.join("\n").replace(
    "--ignore=scripts/video-cut.test.ts",
    "",
  )
  for (const slow of ["browser", "video-cut", "lighthouse"]) {
    assert(!run.includes(slow), `the WIP check runs ${slow}`)
  }
})
