/**
 * The home page's own wording that other modules also need: the heading
 * (#615), the lead (#529, #615), the meta description (#269) and the hero
 * video (#615). It reads its figures from `lib/proof.ts` instead of typing them, and imports nothing that reads the environment, so
 * `lib/home.test.ts` can load it under `deno task test`'s narrow permissions.
 */

import { proof } from "./proof.ts"
import { promise } from "./promises.ts"

/** The ownership promise's title, lower-cased to sit mid-sentence. */
const OWNERSHIP = promise("ownership").title.replace(/^Y/, "y")

/** The H1's small line: who is talking. */
export const HOME_H1_NAME =
  "Anton Shubin, senior full-stack engineer and tech lead"

/** The H1's large line: what Anton takes on for a founder (#615). */
export const HOME_H1_CLAIM = "I take the whole software side off your plate."

/**
 * The home page's lead (#529, #615): the page, the Person JSON-LD, the
 * sitemap comment and both llms files read it, so search and AI assistants
 * quote what a visitor reads. Every claim in it comes from a review in
 * `lib/testimonials.ts`.
 */
export const HOME_LEAD =
  `Your technical partner from idea to revenue. I plan it with you, build it, run it, and hire and lead the team when you need one. You get honest advice, your money is spent like it's mine, and ${OWNERSHIP}.`

/** The lead with who says it, for the places that introduce Anton first. */
export const HOME_INTRO =
  `I'm a senior full-stack engineer and tech lead. ${HOME_LEAD}`

/** The hero's capacity line, a plain fact (Anton's two-client limit). */
export const HOME_CAPACITY =
  "I work with at most two clients at a time, so you always talk to me."

/** The hero's proof line: the Upwork figures from `lib/proof.ts`. */
export function homeProofLine(): string {
  return `Upwork ${proof("expert-vetted")} · ${
    proof("job-success")
  } Job Success · ${proof("jobs")} jobs · ${proof("earned")} earned`
}

/** The hero video's YouTube id: a placeholder short until #619 swaps in the intro. */
export const HOME_VIDEO_ID = "Mnj1t6mfqvc"

/**
 * The hero video's words for the placeholder period: honest about what plays.
 * With the real intro (#619) change them to "Play my one-minute intro video"
 * and "Who I am and how I work, in one minute." The play link's name is the
 * label, a full stop and `HOME_VIDEO_LENGTH`, and it must contain the visible
 * caption (`test/label-in-name.test.ts`), so the two change together.
 */
export const HOME_VIDEO_LABEL = "Play a short from my YouTube channel"
export const HOME_VIDEO_CAPTION = "A short from my YouTube channel."
/** The video's length and host, under the caption: the short is 60 seconds. */
export const HOME_VIDEO_LENGTH = "1 min · YouTube"

/** The longest meta description search engines show without cutting it. */
export const META_DESCRIPTION_MAX = 160

/** The meta description when the lead is too long for one (#615). */
export const HOME_SHORT_DESCRIPTION =
  `Anton Shubin, your technical partner. I take the whole software side off your plate, from idea to revenue, and ${OWNERSHIP}.`

/**
 * The home page's meta description: the lead when it fits within
 * `META_DESCRIPTION_MAX`, else `HOME_SHORT_DESCRIPTION`, so a search result
 * never cuts it. Deliberately not `lib/head.ts`'s `SITE_DESCRIPTION`, which
 * describes the site on every page.
 */
export function homeDescription(): string {
  return HOME_LEAD.length <= META_DESCRIPTION_MAX
    ? HOME_LEAD
    : HOME_SHORT_DESCRIPTION
}

/** The short answer of the home page's "Why not just use AI?" section (#615). */
export const HOME_AI_ANSWER =
  "AI writes code. It doesn't own your product. It won't hire and lead your team, choose the cheapest way to run it, tell you when an idea won't pay off, or answer for the result. I do all of that, and AI agents write most of my code, to my rules and standards, with a weekly review of the code and the agents' work."

/** The section's link to the full comparison on /why-not-just-ai. */
export const HOME_AI_LINK_LABEL =
  "Hire a developer or just use AI? The full comparison"

/** The team offer under it: no price, the brief form is the next step. */
export const HOME_TEAM_LINE =
  "Running a small team that already uses AI? I can set up the same workflow on your repositories: rules, standards, CI the agents don't wait on, and cost control."
export const HOME_TEAM_LINK_LABEL = "Ask about a team set-up"
