/**
 * The home page's own wording that other modules also need: today the meta
 * description (#269). It reads its figures from `lib/proof.ts` and
 * `lib/catalog.ts` instead of typing them, and imports nothing that reads the
 * environment, so `lib/home.test.ts` can load it under `deno task test`'s
 * narrow permissions.
 */

import { INTRO_CALL } from "./catalog.ts";
import { proof } from "./proof.ts";

/** The longest meta description search engines show without cutting it. */
export const META_DESCRIPTION_MAX = 160;

/**
 * The home page's meta description: for a name search the buyer already
 * knows who Anton is, so it confirms the same vetted person and shows the
 * first step. Deliberately not `lib/head.ts`'s `SITE_DESCRIPTION`, which
 * describes the site on every page.
 */
export function homeDescription(): string {
  return `Senior full-stack engineer and tech lead. I build SaaS end to end; you own code, servers and keys. ${
    proof("expert-vetted")
  } on Upwork. Book a ${INTRO_CALL}.`;
}
