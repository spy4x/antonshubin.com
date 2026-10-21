# Design brief

What every page of antonshubin.com is for, who reads it and how it should feel.
The design roles (the global `design` skill) read this first; the tokens and
components it names are described in `AGENTS.md` "Visual system".

## Who the site is for

Buyers who already met Anton somewhere else: on Upwork, through a referral or on
LinkedIn. Many are non-technical founders with a SaaS idea or a product that
needs a senior engineer; some are teams that want a tech lead alongside them.
They arrive warm, with one question: can I trust this person with my project and
my budget?

## The site's job

The site does not bring buyers; it closes them. A visitor should leave convinced
that Anton is a senior full-stack engineer and tech lead they can trust, and
know how to book a call or send a written brief. Proof comes before price, and
the ask comes after both. Next in line: the open-source tools on `/tools` and
the writing, which build the reputation the client work sells on.

Two actions only, in one wording each (`lib/nav.ts`): `BOOK_LABEL` and
`BRIEF_LABEL`. Book buttons live in the page body, never in the navigation,
which names the booking page as a place: Contact.

## Voice

A person, not an agency: first person, plain words, short sentences, no hype.
Concrete over clever: a figure from `lib/proof.ts`, a promise from
`lib/promises.ts`, a client's own words from `lib/testimonials.ts`. Nothing on a
page that Anton did not supply as fact (`AGENTS.md` "Content rule"). Writing
style for posts: `docs/voice.md`.

## Brand

A dark desk lit by one lamp. Four dark surfaces (Ink, Desk, Paper, Lamp),
Parchment and Graphite text, hairline rules, Literata 600 headings and IBM Plex
Sans for everything else. The brand hue is the one Accent, orange `#f97316` with
Ink text, and it fills only Book buttons in the page body. Status colours (Sage,
Mist, Brick) always come with a shape and a word (`StatusMark`).

The shell is the house rail from `@spy4x/preact-system` in its labels variant,
the same frame as Anton's apps, with the site's own palette.

## Three reference products

What to take from each, not what to copy:

- **linear.app**: calm dark surfaces, a navigation that only says where you are,
  and one strong action per screen.
- **vercel.com**: a hero that states the offer in one sentence and puts both
  actions on the first screen; sections with a heading on the left and one "see
  all" link on the right.
- **stripe.com**: proof and prices laid out in even cards with tabular figures,
  generous spacing, and links that read as sentences.
