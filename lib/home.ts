/**
 * The home page's own wording that other modules also need: the lead (#529)
 * and the meta description (#269). It reads its figures from `lib/proof.ts` and
 * `lib/catalog.ts` instead of typing them, and imports nothing that reads the
 * environment, so `lib/home.test.ts` can load it under `deno task test`'s
 * narrow permissions.
 */

import { INTRO_CALL } from "./catalog.ts"
import { proof } from "./proof.ts"

/**
 * The home page's lead, in one sentence (#529): the page, the meta
 * description, the Person JSON-LD, the sitemap comment and both llms files
 * read it, so search and AI assistants quote what a visitor reads.
 */
export const HOME_LEAD =
  "I build and run SaaS products end to end, and you own the code, the servers and the keys from day one."

/** The lead with who says it, for the places that introduce Anton first. */
export const HOME_INTRO =
  `I'm a senior full-stack engineer and tech lead. ${HOME_LEAD}`

/** The longest meta description search engines show without cutting it. */
export const META_DESCRIPTION_MAX = 160

/**
 * The home page's meta description: for a name search the buyer already
 * knows who Anton is (the `<title>` names the role), so it gives the lead,
 * confirms the same vetted person and shows the first step. Deliberately not `lib/head.ts`'s `SITE_DESCRIPTION`, which
 * describes the site on every page.
 */
export function homeDescription(): string {
  return `${HOME_LEAD} Upwork ${proof("expert-vetted")}. Book a ${INTRO_CALL}.`
}
