# Publishing a blog post

The whole flow from "I want a blog post about X" to a live post, the Dev.to
article, the newsletter, tagged links and channel texts (#260). An agent follows
it in order. Three rules hold throughout:

1. **Agents never post to X, LinkedIn, Reddit, Hacker News or Telegram.** They
   write the text; Anton pastes it.
2. **The newsletter goes out automatically once the post is live.**
   `publish:blog` sends it right after the live check, with no one asked first;
   the container refuses a post it already sent, so it never goes out twice.
3. **Dev.to gets the post published, never a draft.** `publish:blog` publishes
   it, or updates the article that already has the post's `canonical_url`.

## 0. Brief: four lenses

Before writing a word, read AGENTS.md "Anton's goals and this site's role" and
the two ai-memory files it names. Then judge the idea through four lenses and
write the result as a short brief. Each lens asks what this post does for
Anton's goals, not whether it is interesting.

- **SEO specialist.** What would the reader type into a search engine or ask an
  AI assistant to find this post? Pick one search intent and one main phrase,
  and put it in the title, the description, the slug and the first paragraph,
  naturally. Check that no existing post already answers it (`content/blog/`);
  if one does, update or link that post instead. Plan two or three internal
  links: to a related post, a project, a tool or the catalog.
- **Marketer.** Who exactly is the reader: a founder or CTO who might hire
  Anton, a developer who might use one of his tools, or both? What should that
  reader do after the last paragraph: book a call, open the catalog, star or try
  a tool, subscribe? Name the one next step and end the post with it. Name the
  channels that fit this reader, which decides which channel texts in step 4 are
  worth writing.
- **Psychologist.** What makes this reader start, keep reading and trust the
  author? Open with the reader's problem or a concrete result, not with
  background, then say what the post is and who it is for, as
  [voice.md](voice.md) "How a post opens" describes. Show proof through
  specifics: code, screenshots, what went wrong, and numbers under AGENTS.md
  "Content rule" only. Answer the reader's likely doubt before they raise it. No
  fake urgency, invented scarcity, flattery or other manipulation: trust is the
  point, and one trick costs it.
- **Personal-brand adviser.** Does the post make Anton look like what he sells:
  a senior full-stack engineer and tech lead who ships, owns outcomes and
  explains plainly? Does it add to a theme he wants to be known for, so posts
  build on each other instead of scattering? Would he be glad to have it found
  under his name in three years? Show expertise through the work, never through
  bragging.

The brief ends with a verdict. If the post serves no goal, or a different angle
serves them clearly better, say so in chat and propose that angle before
drafting; Anton decides. Otherwise the brief goes, in full, into the pull
request body, and the reviewer checks the draft against it. The repository is
public, and so is everything a post produces. The ai-memory files are for
understanding the goals, never a source to quote: the brief, the post, the
channel texts and the newsletter never copy a number or a private detail from
them. A figure comes from Anton in the session (AGENTS.md "Content rule") or,
for Upwork figures, from `lib/proof.ts` through `proof(id)`. Where the harness
has them, the `marketing-seo` and `psychologist` agents can read the finished
draft against the brief before the pull request opens.

## 1. Draft

1. Read [voice.md](voice.md) first, and AGENTS.md "Content rule": no client,
   number, prize, testimonial or guarantee unless Anton gave it as fact in the
   session.
2. Write `content/blog/<slug>.md`. Its front matter is the only place the post's
   metadata is written (#191): `lib/blog-posts.ts` reads every file in
   `content/blog/` and `lib/data.ts` re-exports the list as `blogArticles`, so
   there is no second entry to add by hand.

   ```markdown
   ---
   title: "The post's title"
   description: "One or two sentences; the first 150 characters carry the point"
   tldr: # required; two to four lines, each at most 200 characters
     - "The one result the reader takes away."
     - "The next thing they can act on."
   intro: "Two or three sentences in Anton's voice: why this post exists and who it is for."
   coverImage: "/img/blog/<slug>/cover.png" # 1000x420 PNG, see step 7
   coverAlt: "What the cover shows, for someone who cannot see it."
   publishedAt: "2026-09-26"
   updatedAt: "2026-10-02" # optional; only for a significant edit
   readTime: 8
   topic: "ai-mcp" # founders, ai-mcp, self-hosting or scars
   relatedTool: "mig" # optional; a lib/tools.ts slug
   catalogSlug: "strategy-call" # optional; a lib/catalog.ts slug
   seoTitle: "Short title" # optional; <title> only, for a title over 55 characters
   youtubeVideoId: "abc123" # optional
   utmCampaign: "short-campaign" # optional; defaults to the slug (docs/utm.md)
   ---
   ```

   A post with `publishedAt` on or after 2026-10-02 (`LETTER_FIELDS_FROM`) needs
   `intro`, `coverImage` and `coverAlt`: the build fails naming the one missing.
   An older post falls back to its `description`, its OG preview PNG and its
   title, so none is edited just to keep building. A missing, mistyped or
   unknown field fails the tests, naming the file. An Upwork figure in a title
   or description is written `{proof:jobs}` (the career count
   `{proof:projects}`), never the number itself. Link the post's tool with
   `relatedTool` and the service it sells with `catalogSlug` (#191's writing
   standard): the post shows the tool's page, demo and repository under the
   byline, and the service as a text link in the author box. A post with a
   `catalogSlug` shows a price, so `test/structure.test.ts` adds it to
   `PRICE_PAGES` on its own.
3. **Every post opens with a TL;DR** (Anton, 30 September 2026): the `tldr`
   list, rendered as a "TL;DR" heading and a list above the body, and listed
   under the post in `llms-full.txt`. Write it last, from the finished draft, as
   [voice.md](voice.md) "TL;DR" describes; a post without one, with fewer than
   two or more than four lines, or with a line over 200 characters fails the
   tests. The `description` stays the search snippet; don't copy one into the
   other. When an update note opens the Markdown, the TL;DR already says what
   the update changed. **The `intro`** is written by the agent, last, from the
   finished post, in Anton's voice ([voice.md](voice.md)): two or three
   sentences on why the post exists and who it is for. It is not the description
   and not the TL;DR. It opens the newsletter mail and the Dev.to article, and
   can open the LinkedIn text. Like the TL;DR it says only what the post says
   (AGENTS.md "Content rule"). **The `coverAlt`** says what the cover shows, in
   one plain sentence.
4. **A post about a project opens with its links.** Set `relatedTool` to its
   `lib/tools.ts` slug: the post's header then shows the tool's page, its
   running instance or demo (`live`) and its repository (`repo`), all read from
   that entry. Never write those links by hand at the top of the Markdown; if
   the tool has no demo yet, add `live` to its entry the day one runs.
5. Posts of 8 minutes or more get a contents list of their `##` headings, so
   give a long post real section headings. Every `##` and `###` gets an id from
   its text.
6. Add any figures the post uses under `static/img/blog/<slug>/` as WebP, run
   `deno task strip-metadata` on them, then run `deno task og` for the 1200×630
   preview and commit the PNG (`deno task og` needs no build and leaves the
   repo's `docs/social-preview.png` alone; that one is
   `deno task social-preview`). The preview PNG stays the link and search image.
   A post about something you can see (a tool, a UI, a chart) opens with a real
   screenshot as the first thing in its Markdown, right under the TL;DR. Like
   every post image it stays lazy: on a phone it sits below the first screen,
   and loading it eagerly made this page's LCP about 180ms slower on the
   throttled network (`deno task lcp --ab`, preact-components post). Every image
   has an alt text that says what it shows and a caption (the Markdown title),
   and sits next to the text that talks about it. Real screenshots only,
   captured at 2x with the repo's Chromium (`test/browser.ts`'s
   `launchChromium()`), never a mockup.
7. **A cover**, used by the Dev.to article and the newsletter mail. Set
   `coverImage` to a site path of a 1000×420 PNG under
   `static/img/blog/<slug>/`, cropped from the hero screenshot with no text
   added; `publish:blog` sends it as the article's `main_image`.
   `lib/blog-posts.ts` fails on a path outside `/img/`, a non-PNG or a missing
   file, and `lib/blog-posts.test.ts` on a cover that is not 1000×420. It is
   required for a new post; an older post's mail uses its OG preview PNG.
8. Check the "AI crawler optimization (SEO)" table in
   [seo-ai-crawlers.md](seo-ai-crawlers.md). The sitemap, the RSS feed and both
   llms files read `blogArticles`, so they update themselves; the doc rows may
   still need a line.

**Archiving a post.** Set `archived: true`. The post moves under Archive on
`/blog`, leaves "Read next" and the RSS feed, drops to sitemap priority 0.3 and
opens with "Written in <Month Year>. Kept as written." An optional `archiveNote`
adds one line on what changed since, in Anton's words, and an optional
`supersededBy` (a current post's slug) links that post after the note. It stays
on its URL and in search; don't change its `updatedAt` for the note.

## 2. Ship

Branch, pull request, reviewer gate, merge, then `deno task deploy` from `main`,
exactly as AGENTS.md "Deploy" says. Never push to `main` directly.

## 3. After the deploy

```bash
deno task publish:blog <slug>
```

It writes no file, and needs no one's go-ahead. It:

1. Reads `content/blog/<slug>.md` and its `blogArticles` entry, and stops if
   either is missing.
2. Fetches `https://antonshubin.com/blog/<slug>` and stops unless it answers
   200. Nothing below runs for a post that is not live.
3. Publishes the post on Dev.to (`published: true`, a clean `canonical_url`, the
   post's campaign, the `coverImage` as `main_image`), opening with the `intro`,
   then the TL;DR and, for a post with `relatedTool`, the project's live and
   repository links. When one of Anton's Dev.to articles already has that
   `canonical_url`, published or not, it updates and publishes that one instead
   of creating a second, and a failed lookup creates nothing. It needs
   `DEVTO_API_KEY`, from the environment or the local `.env.deploy` (restored by
   `deno task env:decrypt`, never uploaded); without it, or when Dev.to refuses,
   it says so and goes on to the newsletter.
4. Pings IndexNow with the post and `/blog` (`lib/indexnow.ts`), which asks Bing
   to recrawl them; Bing's index also feeds ChatGPT search and Copilot. It fails
   open and prints the answer. Google does not use IndexNow: it finds the post
   through the sitemap, or Anton can request indexing in Search Console's URL
   Inspection.
5. Prints the post's tagged link for every channel.
6. Sends the newsletter (step 5 below) from the production container.

A Dev.to failure does not stop the newsletter, and a failed send does not undo
Dev.to. The command exits non-zero when either failed, and its last lines say
which. Running it again is safe: Dev.to gets the same article updated, and the
container refuses a newsletter it already sent (that rerun exits non-zero with
the refusal, and nothing goes out).

## 4. Channel texts

The agent writes one text per channel in Anton's voice ([voice.md](voice.md)
"Channel texts"), each with its tagged link from step 3:

- an X post (`x` link);
- a LinkedIn post (`linkedin` link);
- a Reddit title and body, with two or three suggested subreddits, each with its
  own link from `deno task links /blog/<slug> --content r-<subreddit>`;
- a Hacker News title (`hn` link);
- a Telegram channel post (`telegram` link). Every set of channel texts includes
  it.

The brief from step 0 picks the reader and the one result each text carries;
[voice.md](voice.md) "Channel texts" decides each channel's shape and how it
opens. Reddit and Hacker News punish anything that reads as self-promotion, so
the result there is what the reader learns, not what Anton did. Skip a channel
the brief ruled out, and say which and why.

It shows them in chat and stops there. The texts are not saved to a file: the
links can be printed again any time with `deno task links`.

## 5. Newsletter

The newsletter is a letter from Anton (#364): his portrait and name, then the
post's cover linked to the post, the `intro`, "In short" with the TL;DR, one
button ("Read the article · N min") and a P.S. with the booking link. The
subject is the post's title alone; the hidden preview line is the first TL;DR
line. Every link into the site is the `email` channel's tagged URL, and every
mail carries the subscriber's own one-click `List-Unsubscribe`.

`publish:blog <slug>` sends it. To look at it or test it first, before the
deploy or without sending to the list:

```bash
deno task publish:blog <slug> --preview mail.html   # writes mail.html and mail.txt, sends nothing
deno task publish:blog <slug> --test-newsletter     # one copy to CONTACT_EMAIL, no log
```

`--preview` needs no live post. `--test-newsletter` runs the container's send
with `--test`: one mail with a "[Test]" subject to `CONTACT_EMAIL` only, and the
sent log is untouched.

The send itself, in the default run, pipes the rendered announcement over SSH
into `scripts/send-newsletter.ts --stdin-json` inside the production container,
the only place with the subscriber list and the SMTP settings
([newsletter.md](newsletter.md)). The container keeps a per-recipient sent log
in `data/newsletter-log.json`: it records the post before the first mail and
each subscriber, as a keyed hash of the address, right after their mail is
accepted. A post whose run finished with no failure is refused, so a second run
cannot mail anyone twice. A run that crashed or had a failure is resumed by
running `publish:blog <slug>` again, and mails only the people the first run
meant it for who were missed, never a later subscriber. A second run started
while one is going is refused. To resend on purpose, remove the post's entry
from the log on the server by hand. An empty subscriber list is refused before
anything is recorded, and the command exits non-zero when any mail failed or
none went out.

Report the result to Anton in chat: the `Sent`, `Failed` and `Skipped` counts
the command printed, or its refusal. A non-zero exit is not a success, whatever
it printed.

## Interactive components

A post can embed a component the reader can try (#537), such as a calculator.

**Embedding one.** Write its tag alone on a line, at the top level of the post
(not inside a list or a quote), with props as JSON literals in braces or text in
double quotes:

```markdown
<RunsCalculator saving={15} label="My run" marks={[10, 32]} />
```

Say every claim and number in the prose above it too: the component is extra,
and Dev.to, search engines and readers without JavaScript see only the prose and
the fallback. The default props must show the case the prose describes. The post
renders the component in a box whose `id` is the entry's anchor, so
`/blog/<slug>#<anchor>` links to it. An unknown tag, a prop that fails the
schema, a tag that is not alone on its line or an anchor used twice on the page
fails the render, and `lib/post-components.test.ts` renders every post in
`content/blog/`, so `deno task check` fails naming the post, the tag and the
reason. A tag inside a code block is code and stays as written. `deno fmt` wraps
a tag longer than 80 columns onto several lines, which then fails the render, so
put `<!-- deno-fmt-ignore -->` on the line above a long tag (the Trail-code
post's `RunsCalculator` does).

**Adding one.** Write the component in `islands/` (or `components/` when it
needs no JavaScript), then add an entry to `POST_COMPONENTS` in
`lib/post-components.ts` through `postComponent()`:

- `props`: an arktype schema with `"+": "reject"`, so a mistyped prop fails;
- `component`: it gets the props plus `post`, the post's slug;
- `anchor`: a stable id, or a function of the props when a post can embed the
  component twice;
- `toMarkdown(props, postUrl)`: the Dev.to fallback, usually a table. The Dev.to
  body, from `lib/markdown.ts`'s `toDevToMarkdown(body, postUrl)`, puts it in
  the tag's place and adds "Try it on antonshubin.com" with the tagged link to
  the anchor.

Registered today: `CachedShareSlider` (the Opus 5.5 post), `FrameworkChecklist`
(the cost laboratory post), `RunsCalculator` and `TaskCostChart` (the Trail-code
post). Each sits in the library's `Explorable` frame. `TaskCostChart` is a
server component with no island; it reads the post's dated data file,
`content/blog/data/<slug>.json`, through `lib/task-cost.ts`, which also writes
its summary sentence and its Dev.to table, so no number in the chart is typed by
hand. The arithmetic of the other three lives in `lib/post-math.ts` and
`lib/framework-checklist.ts`, next to their fallbacks.

On the reader's first input the component calls
`trackPostTry(post, "<TagName>")` from `lib/analytics.ts`, which sends one
`post-try` per component per page view ([analytics.md](analytics.md)). It never
sends, stores or puts in the URL a value the reader entered. Render it in full
on the server at a fixed size, so nothing shifts when it hydrates. Fresh 2.3
hydrates every island as the page loads (there is no lazy hydration), so keep
its code small.

## The flow in short, and its hard rules

This file is the whole flow, from "I want a blog post about X" to a live post: a
brief that judges the post as an SEO specialist, a marketer, a psychologist and
a personal-brand adviser against the goals in AGENTS.md "Anton's goals and this
site's role", a draft in Anton's voice (`docs/voice.md`, learned from the five
oldest posts), a pull request with the post file and its front matter (no
`lib/data.ts` entry: the metadata is read from the file), review, merge, deploy,
then `deno task publish:blog <slug>`. That script writes no file: it checks the
post answers 200 live, publishes the post on Dev.to, pings IndexNow, prints
every channel's tagged link and sends the newsletter. Every post opens with a
TL;DR, two to four short lines in its required `tldr` front matter
(`lib/blog-posts.ts` fails the build without it, and `llms-full.txt` lists it),
and a post about a project sets `relatedTool`, so its header shows that tool's
demo (`live`) and repository (`repo`) from `lib/tools.ts`, never hand-written
links; `test/blog.test.ts` checks both on every post. A post about something
visual opens with a real screenshot right under its TL;DR (lazy like every post
image: eager, it made the post's phone LCP slower), and its `coverImage` (a
1000×420 PNG under `static/img/`) becomes the Dev.to cover and the newsletter's
picture; `publish:blog` updates the Dev.to article that already has the same
`canonical_url` instead of adding a second. Since #364 a post published on or
after 2026-10-02 (`LETTER_FIELDS_FROM` in `lib/blog-posts.ts`) must also carry
`intro` (two or three sentences in Anton's voice on why the post exists and who
it is for, written by the agent last, from the finished post; it opens the
newsletter and the Dev.to article and can open a LinkedIn post) and `coverAlt`,
and the build fails without any of the three; older posts fall back to their
`description`, their OG preview PNG and their title. The newsletter is that
letter with the cover, the intro, "In short", one button and the P.S.; its
subject is the post's title alone. `publish:blog <slug> --preview <file>` writes
its HTML and text locally and `--test-newsletter` sends one copy to
`CONTACT_EMAIL` with no log. Three hard rules:

- **Agents never post to X, LinkedIn, Reddit, Hacker News or Telegram.** They
  write one text per channel with its tagged link and show it in chat; Anton
  pastes it.
- **The newsletter goes out automatically once the post is live**, sent by
  `deno task publish:blog <slug>` with no one asked first. The production
  container keeps a per-recipient sent log, `data/newsletter-log.json` (a keyed
  hash of each address, never the address): it refuses a post whose run finished
  with no failure, a rerun after a partial failure mails only the people the
  first run meant it for who were missed (never a later subscriber), and a
  second run started while one is going is refused by a lock file.
- **Dev.to gets the post published, never a draft**, by the same run.
