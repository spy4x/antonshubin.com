# Proof, promises, testimonials and notes

Four more `lib/*.ts` files hold the only written copy of a category of claim
(#186), the same pattern as `lib/catalog.ts` for prices — each exports a lookup
that throws on a typo, so a bad id fails the build instead of shipping a broken
reference.

- **"80+ projects" is true; never flag it.** Anton has shipped more than 80
  projects across his career, on Upwork and outside it; Upwork's 80 jobs are
  only part of them (Anton, 2 October 2026). The two figures are separate
  entries in `lib/proof.ts`: `jobs` ("80", always next to Upwork) and `projects`
  ("80+", the whole career).
- `lib/proof.ts` is the only place an Upwork number or label (jobs, job success
  rate, amount earned, hours, Expert-Vetted, Top 1%) or the career project count
  is written. The home page, `components/SEOHead.tsx`'s JSON-LD, the sitemap
  comment, both llms files, `islands/LeadForm.tsx`,
  `routes/saas-architecture-guide.tsx` and `lib/tools.ts`'s template entry all
  read a value through `proof(id)`. A post's front matter writes a figure as a
  `{proof:<id>}` placeholder (the template post's title uses
  `{proof:projects}`), which `lib/blog-posts.ts`'s `fillProof()` replaces.
  `test/proof-promises-notes.test.ts`'s proof guard scans `routes/`,
  `components/`, `islands/` and `lib/` (excluding `lib/proof.ts` and every
  `*.test.ts`) for each figure's exact rendered text — including the
  quoted-literal and case-insensitive forms a hand revert of the home proof
  strip would take (with an explicit allowlist entry for
  `islands/MeetEmbed.tsx`'s unrelated CSS `width: "100%"`) — and fails on a
  hand-written copy.
- `lib/promises.ts` holds the five promises' title, description and "why this
  matters" text. `/how-i-work` is where this wording was written and reviewed,
  so its copy is canonical; `routes/how-i-work.tsx`'s FAQ answers, the home
  page's "How a project runs" timeline (`components/PromiseTimeline.tsx`, shared
  with the coming `/how-i-work` redesign: `lib/promises.ts` lists the five in
  the order a project meets them, each with a `when` label), both llms files'
  Promises sections and `lib/catalog.ts`'s bug-fix bullet all splice a promise's
  `title`/`desc` through `promise(id)` (and `decapitalize()`/`firstSentence()`
  where a sentence needs to read as part of a longer one) instead of restating
  it. The same guard test scans for each promise's exact `title` and `desc`
  text, plus a short list of promise-specific key terms ("one or two weeks of
  work", "fixed free for 30 days"), outside `lib/promises.ts`.
- `lib/testimonials.ts` holds every client review (#231): public Upwork reviews
  copied verbatim from the portfolio archive, the client's spelling included,
  each tied to a client project by `projectSlug` (`testimonialProject()` throws
  on a typo) and cited by project, period and the client's name, linked to their
  profile (the project's `madeForName`/`madeForURL`, rendered by
  `components/ReviewSource.tsx` as "<client> reviewed on Upwork"; Anton asked
  for the name on 26 Sep 2026). An `excerpt` is only exact pieces of its `quote`
  joined by " … " — cut around a misspelling, never fix it.
  `lib/testimonials.test.ts` checks the slugs, the excerpts and the pinned
  misspellings. A project page shows its first review's excerpt as a pull quote
  under the hero, then every visible review in full
  (`components/ProjectReviews.tsx`), with the attribution printed once above the
  group and no period under each review; `routes/index.tsx` shows the three
  excerpts in `homeTestimonialIds` through `components/TestimonialCard.tsx`, and
  `test/reviews.test.ts` checks both on the built pages. `visibleTestimonials()`
  still filters on `sourceHref` and `permission: true`.
- Every client project in `lib/data.ts` carries a `period` (`lib/data.test.ts`
  fails without one), rendered by `formatPeriod()` ("2021", "2018–2019",
  "2024–now") on the cards, the project page fact card and the JSON-LD
  `dateCreated` and `temporalCoverage`. `outcomeNote`/`externalURLNote` attach a
  margin note to a project's outcome or live link.
- `lib/notes.ts` holds every margin note (`{ id, text, href?, checkedOn? }`) —
  the source or checked date behind a claim wrapped in
  `components/WithNote.tsx`, which stamps the claim with `data-note-ref="<id>"`.
  `test/proof-promises-notes.test.ts`'s note guard fetches every page in
  `/sitemap.xml` and fails if a `data-note-ref` doesn't resolve to a note
  carrying `href` or `checkedOn`. The note itself sits in a `.note-wrap` CSS
  grid column from 1100px (`assets/styles.css`), reserved inside the wrapper's
  own box rather than positioned into the page's margin, so it can't cause
  horizontal scroll regardless of viewport width — `test/notes.browser.test.ts`
  asserts `document.documentElement.scrollWidth` and the note's right edge never
  exceed the viewport, at 1100/1280/1440px.
