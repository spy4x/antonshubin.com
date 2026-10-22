// What a client case page (`/work/<slug>`, #523) says about its project
// beyond the raw data: the headline, the `<title>`, the meta description, the
// top line, the hero picture. Every word comes from `lib/data.ts`; this file
// only arranges it, so nothing here is new copy.
import {
  formatPeriod,
  type Project,
  projects,
  projectScreenshots,
} from "./data.ts"
import { webpForPng } from "./image-path.ts"
import { FIGURE } from "./llms.ts"
import { followOnHires } from "./testimonials.ts"

/** The longest `<title>` that still keeps the site name after it. */
export const TITLE_MAX = 60

/** The longest meta description a case page has; it is never cut mid-way. */
export const CASE_DESCRIPTION_MAX = 155

/** What follows a page's own title when it fits within `TITLE_MAX`. */
export const SITE_SUFFIX = " — Anton Shubin"

/** `text` with its first letter in upper case, for a `kind` on a line of its own. */
export function upperFirst(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

/** The product's name and what it is: "SmartLite: real-time IoT control for about 200 lamp poles". */
export function projectHeadline(p: Project): string {
  return p.kind ? `${p.title}: ${p.kind}` : p.title
}

/** Whether `kind` states a figure ("about 200 lamp poles") that `text` already says. */
export function kindRepeatsFigure(p: Project, text: string): boolean {
  return (p.kind?.match(FIGURE) ?? []).some((f) => text.includes(f))
}

/**
 * The headline for a line that goes on to say `rest`: the name alone when
 * the kind would say the same figure twice (the llms files, #523).
 */
export function headlineBefore(p: Project, rest: string): string {
  return kindRepeatsFigure(p, rest) ? p.title : projectHeadline(p)
}

/** The page's `<title>`: the headline, plus the site name when both fit in `TITLE_MAX`. */
export function caseTitle(p: Project): string {
  const headline = projectHeadline(p)
  const full = `${headline}${SITE_SUFFIX}`
  return full.length <= TITLE_MAX ? full : headline
}

/** The name before a subtitle: "Roley — Make a Movie!" → "Roley", "Truth or Dare (DareChat)" → "Truth or Dare". */
export function shortName(p: Project): string {
  return p.title.split(/ — | \(/)[0]
}

/** "For Yumetronics · 2024–now", or "Client work · 2017" for a project with no named client. */
export function caseTopLine(p: Project): string {
  const when = p.period ? ` · ${formatPeriod(p.period)}` : ""
  return p.madeForName ? `For ${p.madeForName}${when}` : `Client work${when}`
}

/** `text` ending in sentence punctuation. */
function sentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim()
  return /[.!?]$/.test(flat) ? flat : `${flat}.`
}

/**
 * The page's meta description (#523, SEO 2): the outcome first, then what
 * the product is (the description's first sentence, or `kind` when that
 * sentence does not fit beside the outcome), who it was built for and when,
 * then the description's other sentences in order. A part that would pass
 * `CASE_DESCRIPTION_MAX` is left out whole and the next one is tried, so the
 * text is never cut inside a sentence. A sentence about the screenshots is
 * left out (a search result shows none), and so is a `kind` that repeats a
 * figure the outcome already states ("about 200 lamp poles").
 */
export function caseDescription(p: Project): string {
  const when = p.period ? `, ${formatPeriod(p.period)}` : ""
  const outcome = p.outcome && sentence(p.outcome)
  const [first, ...rest] = p.description.replace(/\s+/g, " ").trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !/\bscreenshots?\b/i.test(s))
  const repeats = kindRepeatsFigure(p, outcome ?? "")
  const product = p.kind &&
      `${outcome ?? ""} ${first}`.length > CASE_DESCRIPTION_MAX
    ? (repeats ? undefined : sentence(upperFirst(p.kind)))
    : first
  const parts = [
    outcome,
    product,
    p.madeForName && `Built for ${p.madeForName}${when}.`,
    ...rest,
  ].filter((part): part is string => Boolean(part))
  let text = ""
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part
    if (next.length <= CASE_DESCRIPTION_MAX && !text.includes(part)) {
      text = next
    }
  }
  return text
}

/** The case page's first picture: the first screenshot, as the file browsers load. */
export interface HeroShot {
  src: string
  alt: string
  width?: number
  height?: number
  /** A bare phone screen (its file name ends in `-mobile`), drawn in a phone frame. */
  phone: boolean
  /** Taller than wide: the hero keeps it narrow so it never towers over the title. */
  portrait: boolean
}

/**
 * The hero picture (#523): the project's first screenshot, its WebP when the
 * listed file is a PNG, sized from `screenshotSize` or `heroSize`. Only a
 * bare phone screen gets the phone frame: a store graphic that already draws
 * a phone (Corecircle's, Connectful's) stays in the plain frame. Undefined
 * for a project with no screenshot.
 */
export function heroShot(p: Project): HeroShot | undefined {
  const first = projectScreenshots(p)[0]
  if (!first) return undefined
  const size = p.screenshotSize ?? p.heroSize
  return {
    src: webpForPng(first.src) ?? first.src,
    alt: first.alt,
    width: size?.width,
    height: size?.height,
    phone: /[-_]mobile\.[a-z]+$/i.test(first.src),
    portrait: size ? size.height > size.width : false,
  }
}

/**
 * The hero picture's width from 1024px, in rem: the right column of
 * `CaseHero` (`minmax(0,33rem)`), or `lg:max-w-64` for a portrait shot.
 */
export const HERO_WIDTH_REM = { landscape: 33, portrait: 16 } as const

/** A strip slide's largest size from 1024px: the hero picture's. */
export interface StripTile {
  /** In rem. */
  width: number
  /** In rem. */
  height: number
}

/**
 * The strip's largest slide from 1024px (#562): the hero picture's width
 * and height, so no slide outgrows it. Undefined when the hero has no known
 * size, and the strip keeps the library's own widths.
 */
export function stripTile(shot: HeroShot | undefined): StripTile | undefined {
  if (!shot?.width || !shot.height) return undefined
  const width = shot.portrait
    ? HERO_WIDTH_REM.portrait
    : HERO_WIDTH_REM.landscape
  // The hero's frame takes 1px a side, so its picture is 2px narrower.
  const inner = width - 0.125
  return {
    width,
    height: Math.round(inner * shot.height / shot.width * 100) / 100,
  }
}

/**
 * The pages of the founder who hired Anton twice (#523): Corecircle's story
 * is its review, and Connectful leads with its reviews.
 */
const REVIEW_LED = new Set(["corecircle", "connectful"])

/**
 * The 2014–2018 projects show their reviews before "What I built" (#523):
 * dated screens, strong reviews. So do the pages in `REVIEW_LED`.
 */
export function reviewsFirst(p: Project): boolean {
  return (p.period?.from ?? 0) <= 2018 || REVIEW_LED.has(p.slug ?? "")
}

/** The other project of a founder who hired Anton twice, and the sentence that says so. */
export interface SameFounder {
  other: Project
  line: string
}

/**
 * The follow-on hire `p` belongs to (`followOnHires`), seen from either
 * side: "Nastassia Ponomarenko first hired me for Connectful, then again for
 * Corecircle, her next product." Undefined for any other project.
 */
export function sameFounder(p: Project): SameFounder | undefined {
  const hire = followOnHires.find((h) => h.from === p.slug || h.to === p.slug)
  if (!hire) return undefined
  const find = (slug: string) => {
    const found = projects.freelance.find((x) => x.slug === slug)
    if (!found) throw new Error(`lib/case-page.ts: no client project "${slug}"`)
    return found
  }
  const from = find(hire.from)
  const to = find(hire.to)
  const who = from.madeForName ?? `${shortName(from)}'s founder`
  return {
    other: p.slug === from.slug ? to : from,
    line: `${who} first hired me for ${shortName(from)}, then again for ${
      shortName(to)
    }, ${hire.possessive} next product.`,
  }
}
