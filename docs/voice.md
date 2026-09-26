# Voice guide

How Anton writes, for an agent drafting a post or a channel text in his voice.
It describes the five oldest posts, by `publishedAt` in `lib/data.ts`:

| Post                                                                | Published  |
| ------------------------------------------------------------------- | ---------- |
| `ship-it-today`                                                     | 2022-04-27 |
| `from-office-job-to-freelance-to-my-startups`                       | 2022-06-07 |
| `how-to-keep-sane-while-developing-saas-alone-part-1-mental-health` | 2022-12-15 |
| `the-importance-of-code-formatting-with-prettier`                   | 2022-12-21 |
| `setting-up-your-own-ci-cd-server-with-drone-ci`                    | 2023-02-12 |

The examples below are short pieces of those posts, quoted as written. This
guide describes a style; it is not a source of facts. AGENTS.md "Content rule"
applies to every draft: no client, number, prize, testimonial or guarantee
unless Anton gave it as fact in the session.

## Two kinds of post

All five are written by the same person for the same reader: someone building
software, often alone, who wants a practical next step. They fall into two
kinds, and a new post takes the shape of the kind it is:

- **Story posts** (`ship-it-today`, `from-office-job-to-freelance-...`, and the
  opening of the mental-health post) tell Anton's own experience, with real
  detail and some self-irony, and draw a lesson from it.
- **How-to posts** (the Prettier and Drone CI posts, and the numbered techniques
  of the mental-health post) name a problem, walk through the fix in numbered
  steps, show the real config, compare it with the usual alternative
  ("Comparison with GitHub CI"), mention the cost angle ("Allocating a single
  server for multiple projects") and end with a bonus from his own setup
  ("Bonus - My Prettier Config").

Both kinds talk to the reader directly and casually: "Hey there!", "But let's be
real", "Why Drone CI is cool".

## How a post opens

- It says what the post is and who it is for, plainly, often under the headings
  "What is it about?" and "Who is it for?". Example: "Today I'll share my
  approach to shipping an app idea."
- It links back to an earlier post when the topic continues one: "In my previous
  blog post, I shared my opinion on why you should be brave..."
- It promises the reader something concrete: "I'll motivate you to start right
  where you are".

## Sentences

- Short and direct. Many paragraphs are one to three sentences.
- "I" for what Anton did, "you" for the reader. "We" means real people who were
  there ("we were on a Skype call for 9 hours every day"), and also opens some
  articles ("we'll explore what Drone CI is"); in a new draft, prefer "I'll
  show" to that article "we".
- Fragments are allowed for rhythm: "Where it makes sense. When it makes sense."
  and "You'll change it later. Maybe. Or maybe never."
- Conversational openers: "Ok, so what's next?", "By the way,".
- English as a second language shows in small ways (a missing article here and
  there). Keep the directness; fix grammar mistakes in new drafts rather than
  imitating them.

## Personal experience and mistakes

The story passages tell Anton's own experience with real detail and some
self-irony:

- A mistake owned up front: "It was the first time I had made a big mistake."
- Humour at his own expense: "I wanted a fancy car. Well, as fancy as I could
  afford :D"
- Lessons drawn from what clients did, without naming them: "Many of my clients
  spent years developing a fully functioning app".
- Numbers he actually had, laid out plainly, one line per year: hourly rate,
  hours worked and monthly income. Only use numbers Anton gives you for the new
  post.

## Structure

- `##` headings as questions or plain labels: "What to build?", "How to build
  it?", "When to build?". `###` for the parts of one section.
- A numbered list of principles, then one `###` section per principle ("Let's
  look at each principle deeper.").
- A blockquote for the one line the reader should remember: "It's better to have
  a solid half than a shitty whole."
- An image or two per section with an alt text that is itself a joke or a point:
  "You can't screw up too much if you do something small".
- Technical posts show the real config or code block, then explain it line by
  line in a numbered list.

## How a post closes

- A short push to act, not a summary: "Make yourself a 24h hackathon, develop a
  single-feature MVP, and just" ship it.
- An invitation: a question to the reader, or a pointer to subscribe for the
  next part.
- Skip "In conclusion," and a paragraph that repeats the post; the reader has
  just read it.

## Phrases to keep out of new drafts

Some stock phrases turn up in the posts. They are not what makes the voice
recognisable, and today they read as generated text, so leave them out:

- "In conclusion", "It's important to", "crucial", "essential for success",
  "vast library", "powerful, flexible, and easy-to-use".
- Rhetorical sales questions stacked at the start ("Are you tired of...?
  Does...? Are you frustrated...?").
- Bullet lists where every item starts with the same verb pattern and says
  nothing specific.
- Filler reassurance: "Trust me, it's worth it!", "Good luck!".
- Emoji (the site's `test/no-emoji.test.ts` fails on them anyway).

## Channel texts

Every link in a channel text is a tagged link printed by
`deno task publish:blog <slug>` or `deno task links /blog/<slug>`; never type
one by hand (docs/utm.md). Agents write these texts; Anton pastes them. Agents
never post.

| Channel     | Shape                                                                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X           | One post, at most 280 characters with the link (X counts any link as 23). The single most concrete finding or number from the post, first person, then the `x` link. No hashtag wall; one at most.                                                    |
| LinkedIn    | Three to six short paragraphs. Open with the finding or the mistake, not with "I'm excited to share". A line of context, what changed, then the `linkedin` link on its own line.                                                                      |
| Reddit      | A title that states the finding plainly, no clickbait. A body that stands on its own: what was done, what was found, one caveat, then the link. Suggest two or three subreddits that fit the topic; each gets its own `--content r-<subreddit>` link. |
| Hacker News | A title only, at most 80 characters, factual, no adjectives or exclamation marks. The `hn` link is the submission URL.                                                                                                                                |
| Newsletter  | Printed by `publish:blog`: the title, the description and the `email` link. Sent only on Anton's yes in chat (docs/publishing.md).                                                                                                                    |
