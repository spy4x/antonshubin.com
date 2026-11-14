---
title: "Designing screens with AI expert roles: what each one caught"
seoTitle: "Designing UI with AI agents in expert roles"
description: "Before an AI agent builds a screen, four AI roles review the plan and a fifth checks the result in a browser. Here is what each one caught on a real redesign, with links."
tldr:
  - "I don't ask one AI to design a screen. A product designer, a product lead, a UX writer and a psychologist advise in parallel, and a lead merges one spec."
  - "The spec ends with a table: every recommendation, the role that gave it, and whether it was adopted or dropped. That table is where weak ideas get cut."
  - "After the build, a design reviewer opens the screens in a browser at 390 and 1440 px with axe-core and the keyboard. It found a Block dialog that never said who."
  - "The roles still miss things: the big calls in this redesign were mine, and a wording rule drifted until a later fix settled it."
intro: "People ask how my products end up looking finished when AI agents write most of the code. The answer is a design phase with separate AI roles and a design gate after the build. This post walks through one real redesign of Seed, role by role, with a link to every catch and an honest list of what did not work."
coverImage: "/img/blog/designing-screens-with-ai-expert-roles/cover.png"
coverAlt: "The Drake meme: Drake turns away from \"Ask one AI to make it look good\" and approves \"Four expert roles, one merged spec\"."
coverSize: "720x720"
publishedAt: "2026-11-14"
readTime: 9
topic: "ai-mcp"
relatedTool: "dotfiles"
---

![Seed's New group page in the dark theme: a back arrow and the title "New group", then Name with "Design crew" typed in, Description marked Optional with "0 of 500 characters", Emoji, a row of colour swatches, and the buttons Cancel and Create group](/img/blog/designing-screens-with-ai-expert-roles/new-group.webp "Seed's New group page, from the public demo. Four roles advised on this screen before any code.")

I don't ask one AI model to "design a nice screen". When I design UI with AI
agents, four of them, each with a different job description, read the same brief
in parallel: a product designer, a product lead, a UX writer and a psychologist.
A lead agent merges their advice into one spec, with a table of what each
recommendation became. After the build, a separate design reviewer opens the
screens in a real browser and blocks the merge if something is broken.

This post shows what each role caught in one real redesign, of the app in
[Seed](/tools/seed), my free SaaS starter, in October 2026. Every catch links to
the issue or pull request where it's written down, so you can check me.

It's for founders who wonder why my products look finished when agents write
most of the code, and for developers who run agents and want screens that don't
look like a default template.

## What does each role do?

Each role is a Markdown file in my public
[dotfiles](https://github.com/spy4x/dotfiles/tree/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents)
repository. Here is each one in a sentence or two:

- **[Product designer](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/product-designer.md).**
  The job of the screen, hierarchy, layout "mobile first at 390 px, then 1440
  px", every state (empty, loading, error, offline), keyboard paths and
  contrast. It returns at most ten recommendations and a wireframe at both
  widths.
- **[Product lead](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/product-lead.md).**
  The CEO lens: who it's for, what to cut so it ships sooner, the one number it
  should move, and the risk (personal data, legal text, abuse).
- **[UX writer](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/ux-writer.md).**
  Every word on the screen. "Buttons say what happens ("Save note", not
  "Submit")", and "one term per concept across the app". It returns the final
  copy for every string, grouped by state.
- **[Psychologist](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/psychologist.md).**
  Trust, cognitive load and motivation. It names the framework it uses, says how
  well established the evidence is, and refuses dark patterns: "no fake urgency,
  no hidden costs, no forced continuity, no misdirection, no confirm-shaming".
- **[Marketing and SEO](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/marketing-seo.md).**
  Joins only for pages a visitor uses to decide: public pages, pricing, sign-up.
  It sat out this redesign, which was all signed-in screens.
- **[Design reviewer](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/agents/design-reviewer.md).**
  Comes after the build. Its file tells it, "You did not design or build this
  screen." It opens every changed screen with Playwright at 390 and 1440 px in
  every theme, runs axe-core, walks it with the keyboard only, and tries the
  main task as a first-time user.

None of them writes code. Every file asks for the same `strong` model tier, so
the difference between them is only the job description. That turns out to be
enough.

![The Spider-Man pointing meme with three Spider-Men pointing at each other, labelled "Designer", "Writer" and "Psychologist", under the caption "Same model, different job descriptions"](/img/blog/designing-screens-with-ai-expert-roles/same-model.webp "One model, four job descriptions, surprisingly different opinions.")

The order lives in the
[`design` skill](https://github.com/spy4x/dotfiles/blob/9959ed264b4c514688fef8d96fc8b93ea0baeee4/ai-harnesses/skills/design/SKILL.md),
the instructions an agent loads before it touches anything a person sees:

1. **Ground truth.** Screenshots of the current screens at 390 and 1440 px, in
   every theme, and one shared brief: the job of the screen, the audience, the
   constraints.
2. **Roles in parallel, no code.** Each returns at most ten recommendations,
   most important first.
3. **One merged spec, by the lead.** Wireframes, the final copy, and a table:
   "each recommendation, and what it became or why it was dropped".
4. **Build, look, revise.** The implementer screenshots its own work and revises
   it "at least twice" before opening the pull request.
5. **Design gate.** The design reviewer checks the result next to the code
   reviewer. A public page also has to score at least 95 for performance and 100
   for the rest in Lighthouse mobile.

## What did the roles catch in Seed's redesign?

On 16 October I asked for a redesign of Seed's app: drop the header bar and keep
only the sidebar, and make "New group" open the same editor as editing a group,
instead of a dialog with one Name field. The merged spec is
[template#453](https://github.com/spy4x/template/issues/453) (Seed lived in the
`spy4x/template` repository then; it's archived now). It says: "The design phase
ran the product designer, product lead, UX writer and psychologist." Its
Evidence section has the table of where each recommendation went. These are my
favourite rows.

### Product lead: one request, and limits before the form

The old create call carried only an id and a name, so description, colour and
emoji had to be set afterwards. The product lead asked that "create sends every
field in one request", and that plan limits are "checked before the form, not
after", so nobody fills in a form only to be told they're over their plan. It
also asked for "no pre-fill from the URL". All three were adopted. The New group
page at the top of this post is the result: all four fields, one Create group
button.

### Psychologist: the row is the link, and opening is not switching

In the old app, clicking a group in `/groups` opened its notes, and "Open notes"
was promoted as if notes were the only thing in a group. The psychologist asked
that the whole row be the link, with "Current" written as text. That's how the
list in the [demo](https://app.seedsaas.com) looks today:

![Seed's Groups page in the dark theme: a New group button and four rows, Book club (Viewer, 8 members), Marketing (Editor, 9 members), Product team with the word "Current" next to its name (Owner, 14 members) and Personal (Owner, only you), each with a chevron](/img/blog/designing-screens-with-ai-expert-roles/groups-list.webp "The Groups list in the demo. The current group says so in a word, not an icon.")

Its second catch was quieter. Opening a group's editor must never change your
current group. The product lead said the same thing, and the lead added one
exception: creating a group does switch to it, "since the person made it to use
it".

![The Epic Handshake meme: two arms labelled "Psychologist" and "Product lead" clasp hands over the caption "Opening an editor never switches the group"](/img/blog/designing-screens-with-ai-expert-roles/handshake.webp "When two roles say the same thing, the lead stops arguing.")

### Product designer: no danger zone, and secrets shown once

The designer put destructive actions, such as Leave and Delete, in the editor's
"More actions" menu instead of a "danger zone". With the psychologist, it also
asked that a new API token's secret or an invitation link be shown only once, on
its own page. The pull request that built those pages,
[template#479](https://github.com/spy4x/template/pull/479), adds a guard: leave
before you press Done and the page asks "Leave without copying?".

### UX writer: every string, plus what didn't match

The writer returned the copy for every string on every state, and five notes on
wording elsewhere in the app that no longer matched. For example: tags and notes
said "This group was not found." while the group page said "This group does not
exist.", and delete dialogs said "Keep it" in one place and "Cancel" in another.
The spec's summary of its rules: "Create" replaces "Add", and "…" replaces
"...". #479 applied the table across notes and groups.

## What did the design reviewer catch after the build?

The roles above advise before any code. The design reviewer looks at what was
actually built, and it's the one that finds what nobody planned for.

Reviewing the new sidebar in
[template#483](https://github.com/spy4x/template/pull/483), it ran axe-core on
the admin screens and found failures that were already
[on main too](https://github.com/spy4x/template/issues/464#issuecomment-6228761612):
heading levels that skip on the Billing page, and on the System page a `<dl>`
holding `<p>` children and two scrolling tables that the keyboard can't reach.

Those admin screens were built before the design gate existed, so I had already
asked for an audit of all of them. The reviewer checked every admin screen at
390 and 1440 px, light and dark, and
[listed what blocked](https://github.com/spy4x/template/issues/464#issuecomment-6229933108):

- Tab panels showed no focus ring, and focus was lost after a token was revoked.
- At 390 px, the API tokens and audit tables hid the token name, the Revoke
  button and the event.
- At 1440 px, addresses in the audit log broke mid-word.
- There was a card inside a card and dashed empty boxes.
- The block dialog did not name the person.

![The Batman slapping Robin meme: Robin says "Block this person?" and Batman slaps him, answering "Which person?"](/img/blog/designing-screens-with-ai-expert-roles/which-person.webp "The design reviewer, reading a confirmation dialog.")

The fix, [template#502](https://github.com/spy4x/template/pull/502), made each
confirmation name the person ("Block Ada Lovelace") and state the consequence.
The focus ring and the keyboard-scrollable table went into my shared component
library first, so they ship to every app that uses it, not only this one.

## What did not work?

Some recommendations didn't survive the merge, and one fix didn't hold.

**The designer's 280 characters.** Its wireframe gave a group description 280
characters. The API already allowed 500, so the merge dropped it: "Dropped: the
API allows 500 today". You can see "0 of 500 characters" in the first
screenshot. The roles work from the brief and the screenshots, so a limit the
brief doesn't state is a guess.

**More than the job needed.** The designer also wanted to move the group picker
into the shared library ("Dropped for now: only this template needs it today")
and let the admin edit a group's appearance ("Not built: a feature the owner did
not ask for"). Roles happily invent work. The table is where it gets cut, and
the cut is written down instead of silently lost.

**"Create" against "Add".** The writer's rule was one term per concept, and its
table said "Create" replaces "Add". In notes, though, only the editor's button
ended up saying "Create note"; the toast, the shortcut and the audit log still
used "add". Two weeks later, [seed#586](https://github.com/spy4x/seed/pull/586)
fixed the mismatch and settled on "Add note" for notes. A test now pins it.
Today the group editor says "Create group" and the note editor says
["Add note"](https://github.com/spy4x/seed/blob/68545f6921c1265b5251a1361d22c24c678e2869/i18n/app/en.ts#L1024),
which is consistent per thing, if not across the app.

![The Two Buttons meme: a sweating man labelled "The UX writer's one-term rule" can't choose between a button labelled "Create note" and one labelled "Add note"](/img/blog/designing-screens-with-ai-expert-roles/create-or-add.webp "One term per concept. Which one, though?")

## What do the roles still miss?

The big calls in this redesign were mine. "Let's only leave a sidebar", "no need
for product logo", and "it must always be THE SAME COMPONENT" for create and
edit: those are my words, quoted at the top of #453. The roles turned them into
details, states and copy, and caught real problems on the way. The direction
came from me.

![The Always Has Been meme: one astronaut looks at the Earth and asks "Wait, the big changes came from the human?", and a second astronaut behind him answers "Always has been"](/img/blog/designing-screens-with-ai-expert-roles/always-has-been.webp "The roles polish the idea. Someone still has to have it.")

They also miss what isn't in front of them. A limit the brief leaves out, they
guess. A wording rule isn't a check, so "Create" and "Add" drifted apart without
anything turning red. And the design reviewer only judges the screens in the
diff, which is why the old admin screens needed their own audit.

Where AI did the work: every role, the merged spec, the build and both reviews
in this post were AI agents. I wrote the rules they follow and the request that
started it. How the rest of my setup works, the worktrees and the code reviewer
that breaks the code, is in
[my AI coding agent setup](/blog/ai-coding-agent-setup), and what that means for
a project with me is on [how I work](/how-i-work).

If you want to see the result yourself, the
[Seed demo](https://app.seedsaas.com) has a "Try it without an account" button.
Open Groups, press New group, and count the fields.
