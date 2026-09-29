import { promises } from "./promises.ts";

/**
 * The How I work page's own wording that more than one file needs (#275): the
 * page, the OG image script and the llms files read it, like
 * `lib/about.ts` for /about. The promises and the questions live in
 * `lib/promises.ts` and `lib/faqs.ts`. No imports of config or the
 * environment, so a script can load it.
 */

/** The bare page name for the breadcrumb and the H1. */
export const HOW_I_WORK_NAME = "How I work";

/** The line under the H1. */
export const HOW_I_WORK_SUBTITLE =
  "What you can hold me to, in the order it happens.";

/** The `<title>`. */
export const HOW_I_WORK_TITLE =
  "How I work: five promises, pricing and FAQ — Anton Shubin";

/** The meta description and the OG image's subtitle: the five promises as phrases. */
export function howIWorkDescription(): string {
  return `Five promises you can hold me to: ${
    promises.map((p) => p.phrase).join(", ").replace(/, ([^,]*)$/, ", and $1")
  }.`;
}

/** How I price the work, once: the pricing card and the fixed-price answer both read it. */
export const PRICING_RULE =
  "I work fixed price when the scope is fixed, and hourly for staff augmentation, code reviews, or when the work is open-ended.";

/** Who I build for, in Anton's words on #249: the "Good fit" list. */
export const GOOD_FIT: string[] = [
  "Greenfield SaaS on a modern, lightweight stack, built solo or with senior developers from my own pool.",
  "A team that already exists and wants a senior tech lead alongside it.",
  "Full-stack, DevOps and architecture from one person.",
];

/** What I don't do yet: the "Not a fit yet" list. */
export const NOT_A_FIT: string[] = [
  "Mobile apps. I don't build them yet, and I'm looking at Capacitor.",
];
