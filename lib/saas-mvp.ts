import { catalogItem, priceLabel } from "./catalog.ts"
import { decapitalize, promise } from "./promises.ts"
import { type Faq, faqs } from "./faqs.ts"

/**
 * The SaaS MVP service page's own words (#484): the one page for hiring
 * Anton to build a product, which seedsaas.com/mvp redirects to. Prices and
 * the time come from `lib/catalog.ts` and promises from `lib/promises.ts`;
 * the page, its `FAQPage` JSON-LD and `llms-full.txt` read this module.
 *
 * The two questions not taken from `lib/faqs.ts`, and the "Why it costs
 * less" paragraph, come from seedsaas.com/mvp (spy4x/seed,
 * `apps/mpa/routes/mvp.tsx`), which this page replaces.
 */

export const SAAS_MVP_SLUG = "zero-to-production-saas-mvp"

/** The line above the H1: the phrase a buyer searches for. */
export const SAAS_MVP_EYEBROW = "SaaS MVP development"

/** The ownership promise as a clause: its title, decapitalized, then its `desc`. */
function ownershipClause(): string {
  const ownership = promise("ownership")
  return `${decapitalize(ownership.title)}. ${ownership.desc}`
}

/**
 * The page's lead under the H1: what I build and who owns it. No price or
 * time, because the price card right below says both (#501).
 */
export function saasMvpLead(): string {
  return `I build SaaS MVPs on Seed, and ${ownershipClause()}`
}

/**
 * The answer an engine can quote alone: cost, time and ownership in two
 * sentences, for the meta description and `llms-full.txt`.
 */
export function saasMvpAnswer(): string {
  const item = catalogItem(SAAS_MVP_SLUG)
  return `I build SaaS MVPs on Seed ${decapitalize(priceLabel(item))}, live ${
    decapitalize(item.delivery)
  }, and ${ownershipClause()}`
}

export const WHY_IT_COSTS_LESS_HEADING = "Why it costs less"

export const WHY_IT_COSTS_LESS =
  "Every product needs sign-in, teams, payments, emails, backups and a way to deploy. Built from scratch, that is weeks of work before your idea even starts. I keep those parts in Seed, with browser tests that run on every change. Your project starts from there, so the weeks you pay for go to your product, and because Seed is public, any developer you hire later can read how it works."

/** One `lib/faqs.ts` question by id, so its wording stays in one place. */
function sharedFaq(id: string): Faq {
  const f = faqs.find((x) => x.id === id)
  if (!f) throw new Error(`lib/faqs.ts: no question "${id}"`)
  // The page carries the brief twice already (card and band); no third link.
  return { id: f.id, q: f.q, a: f.a }
}

/**
 * The page's questions, last before the closing band. Cost, time, scope,
 * refund and ownership are left out: the lead, the price card, the scope and
 * the band already answer them. Each answer's first sentence stands alone.
 */
export function saasMvpFaqs(): Faq[] {
  return [
    sharedFaq("who-does-the-work"),
    {
      id: "technical",
      q: "Do I need to know anything technical?",
      a: "No. I explain every decision in plain words, with its cost and its trade-off, and you choose.",
    },
    sharedFaq("pricing"),
    {
      id: "another-developer",
      q: "Can I hire another developer later?",
      a: `Yes. Seed is public and documented, so any TypeScript developer can pick it up. ${
        promise("ownership").desc
      }`,
    },
    sharedFaq("ai-and-your-code"),
    sharedFaq("no-clear-idea"),
  ]
}

export const SAAS_MVP_QUESTIONS_HEADING = "Questions before you book"

/** The `llms-full.txt` section: the answer, then the questions. */
export function saasMvpLlmsSection(baseUrl: string): string {
  return `## ${SAAS_MVP_EYEBROW} (${baseUrl}/catalog/${SAAS_MVP_SLUG})

${saasMvpAnswer()}

${saasMvpFaqs().map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}`
}
