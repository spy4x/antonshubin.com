/**
 * The home page's own wording that other modules also need: the heading
 * (#615), the lead (#529, #615), the meta description (#269) and the hero
 * video (#615). It reads its figures from `lib/proof.ts` instead of typing them, and imports nothing that reads the environment, so
 * `lib/home.test.ts` can load it under `deno task test`'s narrow permissions.
 */

import { proof } from "./proof.ts"

/** The H1's small line: who is talking. */
export const HOME_H1_NAME =
  "Anton Shubin, senior full-stack engineer and tech lead"

/** The H1's large line: the judgement Anton sells (#615). */
export const HOME_H1_CLAIM =
  "I tell founders what not to build, then build the rest."

/**
 * The home page's lead, in one sentence (#529, #615): the page, the meta
 * description, the Person JSON-LD, the sitemap comment and both llms files
 * read it, so search and AI assistants quote what a visitor reads.
 */
export const HOME_LEAD =
  "I cut your plan to what proves the idea, then build it with AI agents working to my rules, and you own the code, the servers and the keys from day one."

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

/**
 * The home page's meta description: for a name search the buyer already
 * knows who Anton is (the `<title>` names the role), so it is the lead alone.
 * The lead of #615 leaves no room within `META_DESCRIPTION_MAX` for the old
 * Upwork and Book tail. Deliberately not `lib/head.ts`'s `SITE_DESCRIPTION`,
 * which describes the site on every page.
 */
export function homeDescription(): string {
  return HOME_LEAD
}

/** The short answer of the home page's "Why not just use AI?" section (#615). */
export const HOME_AI_ANSWER =
  "An AI subscription writes the code you ask for. It won't tell you what to leave out, and it won't answer for the result. I do both. AI agents write most of my code, to my rules, style guides and standards. I oversee the work, and every week I review the code and the agents' sessions for anything slow or wasteful."

/** The section's link to the full comparison on /why-not-just-ai. */
export const HOME_AI_LINK_LABEL =
  "Hire a developer or just use AI? The full comparison"

/** The team offer under it: no price, the brief form is the next step. */
export const HOME_TEAM_LINE =
  "Running a small team that already uses AI? I can set up the same workflow on your repositories: rules, standards, CI the agents don't wait on, and cost control."
export const HOME_TEAM_LINK_LABEL = "Ask about a team set-up"
