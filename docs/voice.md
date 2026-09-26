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

## The two registers in these posts

The first two posts, `ship-it-today` and `from-office-job-to-freelance-...`, are
the voice to copy. They are personal, specific and a little playful. The later
three drift into generic prose that could be anyone's: long bullet lists of
"tips", "It's important to", "In conclusion", and marketing questions ("Are you
tired of..."). Treat those three as the edge to stay away from, not as a model.

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
- First person singular throughout. "I" did it, "you" can do it; "we" appears
  only in the "we'll discuss" framing of the weaker posts.
- Fragments are allowed for rhythm: "Where it makes sense. When it makes sense."
  and "You'll change it later. Maybe. Or maybe never."
- Conversational openers: "Ok, so what's next?", "By the way,".
- English as a second language shows in small ways (a missing article here and
  there). Keep the directness; fix grammar mistakes in new drafts rather than
  imitating them.

## Personal experience and mistakes

The strongest passages are Anton's own story, told with real detail and some
self-irony:

- A mistake owned up front: "It was the first time I had made a big mistake."
- Humour at his own expense: "I wanted a fancy car. Well, as fancy as I could
  afford :D"
- Lessons drawn from what clients did, without naming them: "Many of my clients
  spent years developing a fully functioning app".
- Numbers he actually had, laid out plainly (income per year, hourly rate). Only
  use numbers Anton gives you for the new post.

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
- Avoid "In conclusion," and a paragraph that repeats the post; the two weakest
  posts end that way.

## Words and habits to avoid

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
