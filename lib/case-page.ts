// What a client case page (`/work/<slug>`, #523) says about its project
// beyond the raw data: the headline, the `<title>`, the meta description, the
// top line, the hero picture. Every word comes from `lib/data.ts`; this file
// only arranges it, so nothing here is new copy.
import { formatPeriod, type Project, projectScreenshots } from "./data.ts"
import { webpForPng } from "./image-path.ts"
import { FIGURE } from "./llms.ts"

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
  const repeats = (p.kind?.match(FIGURE) ?? []).some((f) =>
    outcome?.includes(f)
  )
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
  /** A phone screenshot (taller than wide), drawn in a phone frame. */
  phone: boolean
}

/**
 * The hero picture (#523): the project's first screenshot, its WebP when the
 * listed file is a PNG, sized from `screenshotSize` or `heroSize`. A phone
 * screenshot is one taller than wide. Undefined for a project with no
 * screenshot.
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
    phone: size ? size.height > size.width * 1.5 : false,
  }
}

/** The 2014–2018 projects show their reviews before "What I built" (#523): dated screens, strong reviews. */
export function reviewsFirst(p: Project): boolean {
  return (p.period?.from ?? 0) <= 2018
}
