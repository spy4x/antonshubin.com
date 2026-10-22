import { IconArrowRight as ArrowRightIcon } from "@spy4x/preact-icons"
import type { Project } from "../../lib/data.ts"
import { sameFounder, shortName } from "../../lib/case-page.ts"
import { workHref } from "../../lib/work.ts"
import { linkEvent } from "../../lib/analytics.ts"

const LINK =
  "inline-flex items-center gap-1 text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-parchment"

/**
 * "The same founder, twice" (#523): the sentence from `sameFounder()` and a
 * link to the founder's other project page, so a buyer who reads one of the
 * two pages finds the other. Nothing for a project with no follow-on hire.
 */
export function SameFounder({ project }: { project: Project }) {
  const pair = sameFounder(project)
  if (!pair) return null
  const href = workHref(pair.other.slug ?? "")
  return (
    <section data-same-founder aria-labelledby="same-founder">
      <h2 id="same-founder" class="text-2xl text-parchment mb-4">
        The same founder, twice
      </h2>
      <p class="max-w-2xl text-lg text-parchment leading-relaxed">
        {pair.line}
      </p>
      <a
        href={href}
        {...linkEvent(href, { place: "body" })}
        class={`${LINK} mt-4`}
      >
        See {shortName(pair.other)}
        <ArrowRightIcon class="w-4 h-4" />
      </a>
    </section>
  )
}
