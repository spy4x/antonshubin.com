import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import {
  CASE_DESCRIPTION_MAX,
  caseDescription,
  caseTitle,
  caseTopLine,
  heroShot,
  projectHeadline,
  reviewsFirst,
  sameFounder,
  shortName,
  SITE_SUFFIX,
  TITLE_MAX,
} from "./case-page.ts"
import { type Project, projects } from "./data.ts"

const base: Project = {
  title: "Lamp",
  slug: "lamp",
  description: "A lamp app. It turns lamps on. It also turns them off.",
}

Deno.test("the headline joins the name and the kind line", () => {
  assertEquals(
    projectHeadline({ ...base, kind: "app for lamps" }),
    "Lamp: app for lamps",
  )
  assertEquals(projectHeadline(base), "Lamp")
})

Deno.test("the title keeps the site name only while it fits", () => {
  assertEquals(
    caseTitle({ ...base, kind: "app for lamps" }),
    `Lamp: app for lamps${SITE_SUFFIX}`,
  )
  const long = { ...base, kind: "x".repeat(TITLE_MAX) }
  assertEquals(caseTitle(long), projectHeadline(long))
})

Deno.test("the meta description leads with the outcome and leaves out a sentence about screenshots or one that does not fit, never cutting one", () => {
  const p: Project = {
    ...base,
    kind: "app for lamps",
    outcome: "Lit 40 rooms",
    madeForName: "Ann",
    period: { from: 2020 },
    description: `A lamp app. The screenshots show it. ${
      "Long ".repeat(40)
    }words. Short end.`,
  }
  assertEquals(
    caseDescription(p),
    "Lit 40 rooms. A lamp app. Built for Ann, 2020. Short end.",
  )
})

Deno.test("the meta description says the kind when the first sentence does not fit beside the outcome", () => {
  const p: Project = {
    ...base,
    kind: "app for lamps",
    outcome: "o".repeat(100),
    description: `${"First ".repeat(12)}sentence. Second.`,
  }
  assert(caseDescription(p).startsWith(`${"o".repeat(100)}. App for lamps.`))
})

Deno.test("no client project's meta description is over the limit or cut", () => {
  for (const p of projects.freelance) {
    const d = caseDescription(p)
    assert(d.length > 40 && d.length <= CASE_DESCRIPTION_MAX, `${p.slug}: ${d}`)
    assert(/[.!?]$/.test(d) && !d.includes("…"), `${p.slug}: ${d}`)
    if (p.outcome) assert(d.startsWith(p.outcome), `${p.slug}: ${d}`)
  }
})

Deno.test("the top line names the client and the years, or says client work", () => {
  assertEquals(
    caseTopLine({
      ...base,
      madeForName: "Ann",
      period: { from: 2024, ongoing: true },
    }),
    "For Ann · 2024–now",
  )
  assertEquals(
    caseTopLine({ ...base, period: { from: 2017 } }),
    "Client work · 2017",
  )
})

Deno.test("the short name drops a subtitle after a dash or a bracket", () => {
  assertEquals(shortName({ ...base, title: "Roley — Make a Movie!" }), "Roley")
  assertEquals(
    shortName({ ...base, title: "Truth or Dare (DareChat)" }),
    "Truth or Dare",
  )
  assertEquals(shortName(base), "Lamp")
})

Deno.test("the hero is the first screenshot as WebP, sized, in a phone frame only when it is a bare phone screen", () => {
  const desk = heroShot({
    ...base,
    screenshotURLs: ["01-home.png"],
    heroSize: { width: 1600, height: 1000 },
  })
  assertEquals(desk, {
    src: "/img/projects/lamp/01-home.webp",
    alt: "Home",
    width: 1600,
    height: 1000,
    phone: false,
    portrait: false,
  })
  const phone = heroShot({
    ...base,
    screenshotURLs: ["01-home-mobile.webp"],
    screenshotSize: { width: 780, height: 1688 },
  })
  assertEquals([phone?.phone, phone?.portrait], [true, true])
  const store = heroShot({
    ...base,
    screenshotURLs: ["1.webp"],
    screenshotSize: { width: 460, height: 996 },
  })
  assertEquals([store?.phone, store?.portrait], [false, true])
  assertEquals(heroShot(base), undefined)
})

Deno.test("only projects from 2018 or before put their reviews first", () => {
  assertEquals(reviewsFirst({ ...base, period: { from: 2018 } }), true)
  assertEquals(reviewsFirst({ ...base, period: { from: 2019 } }), false)
})

Deno.test("Corecircle and Connectful put their reviews first though they are from after 2018", () => {
  for (const slug of ["corecircle", "connectful"]) {
    const p = projects.freelance.find((x) => x.slug === slug)!
    assertEquals(reviewsFirst(p), true, slug)
  }
  assertEquals(reviewsFirst({ ...base, period: { from: 2021 } }), false)
})

Deno.test("sameFounder links each of the founder's two projects to the other, with one sentence", () => {
  const find = (slug: string) =>
    projects.freelance.find((x) => x.slug === slug)!
  const line =
    "Nastassia Ponomarenko first hired me for Connectful, then again for Corecircle, her next product."
  assertEquals(sameFounder(find("corecircle"))?.other.slug, "connectful")
  assertEquals(sameFounder(find("connectful"))?.other.slug, "corecircle")
  assertEquals(sameFounder(find("corecircle"))?.line, line)
  assertEquals(sameFounder(find("connectful"))?.line, line)
  assertEquals(sameFounder(base), undefined)
})

Deno.test("the meta description leaves out a kind line that repeats the outcome's figure", () => {
  const p: Project = {
    ...base,
    kind: "control for about 200 lamp poles",
    outcome: "About 200 lamp poles live",
    description: `${"First ".repeat(30)}sentence.`,
  }
  assertEquals(caseDescription(p), "About 200 lamp poles live.")
})
