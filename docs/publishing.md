# Publishing a blog post

The whole flow from "I want a blog post about X" to a live post, a Dev.to draft,
tagged links and channel texts (#260). An agent follows it in order. Three rules
hold throughout:

1. **Agents never post to X, LinkedIn, Reddit or Hacker News.** They write the
   text; Anton pastes it.
2. **The newsletter goes out only after the post is live, and only when Anton
   says yes in chat to that post.** A newsletter cannot be unsent.
3. **Dev.to gets an unpublished draft only.** Anton publishes it with one click.

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
2. Write `content/blog/<slug>.md` with the front matter real posts use:

   ```markdown
   ---
   title: "The post's title"
   description: "One or two sentences for search results and link previews"
   publishedAt: "2026-09-26"
   readTime: 8
   previewImageURL: "cover.svg"
   utmCampaign: "short-campaign" # optional; defaults to the slug (docs/utm.md)
   ---
   ```

3. Add the post's entry to `blogArticles` in `lib/data.ts` by hand: the next
   free `index`, the same `title`, `slug`, `description`, `readTime`,
   `publishedAt` and `previewImageURL`, and a `category` (`dev-tips`, `startups`
   or `personal`).
4. Add `static/img/blog/<slug>/cover.svg` and any figures the post uses, then
   run `deno task og` for the 1200×630 preview and commit the PNG.
5. Check the "AI crawler optimization" table in AGENTS.md. The sitemap, the RSS
   feed and both llms files read `blogArticles`, so they update themselves; the
   doc rows may still need a line.

## 2. Ship

Branch, pull request, reviewer gate, merge, then `deno task deploy` from `main`,
exactly as AGENTS.md "Deploy" says. Never push to `main` directly.

## 3. After the deploy

```bash
deno task publish:blog <slug>
```

It writes no file. It:

1. Reads `content/blog/<slug>.md` and the `lib/data.ts` entry, and stops if
   either is missing.
2. Fetches `https://antonshubin.com/blog/<slug>` and stops unless it answers
   200. Nothing below runs for a post that is not live.
3. Creates the Dev.to draft (`published: false`, a clean `canonical_url`, the
   post's campaign). It needs `DEVTO_API_KEY`; without it, it warns and goes on.
4. Prints the post's tagged link for every channel, and the newsletter's subject
   and body, whose link is the `email` channel's tagged URL.
5. Sends nothing, and prints the one command that sends.

## 4. Channel texts

The agent writes one text per channel in Anton's voice ([voice.md](voice.md)
"Channel texts"), each with its tagged link from step 3:

- an X post (`x` link);
- a LinkedIn post (`linkedin` link);
- a Reddit title and body, with two or three suggested subreddits, each with its
  own link from `deno task links /blog/<slug> --content r-<subreddit>`;
- a Hacker News title (`hn` link).

The brief from step 0 picks the reader and the one result each text carries;
[voice.md](voice.md) "Channel texts" decides each channel's shape and how it
opens. Reddit and Hacker News punish anything that reads as self-promotion, so
the result there is what the reader learns, not what Anton did. Skip a channel
the brief ruled out, and say which and why.

It shows them in chat and stops there. The texts are not saved to a file: the
links can be printed again any time with `deno task links`.

## 5. Newsletter

The agent shows Anton the subject, the body and the tagged `email` link from
step 3, and asks whether to send. Only after an explicit yes for this post:

```bash
deno task publish:blog <slug> --send-newsletter
```

It repeats the live check, then pipes the announcement over SSH into
`scripts/send-newsletter.ts --stdin-json` inside the production container, the
only place with the subscriber list and the SMTP settings
([newsletter.md](newsletter.md)). The container records the slug in
`data/newsletter-log.json` before the first mail goes out and refuses a slug
that is already there, so a second run cannot mail everyone twice. A run that
crashed partway also refuses; to resend on purpose, remove that entry from the
log on the server by hand. An empty subscriber list is refused before anything
is recorded, and the command exits non-zero when any mail failed or none went
out.

Report the result to Anton in chat: the `Sent` and `Failed` counts the command
printed, or its refusal. A non-zero exit is not a success, whatever it printed.
