# Satellite Articles: The SEO Layer Behind Every YouTube Video

The single biggest mistake I see solo creators make on YouTube is treating each
video as a one-shot piece of content. You film, you upload, you move on. Six
months later you have 30 videos and almost no search traffic. The algorithm
forgot you, Google never noticed you, and you burned out.

The fix is **satellite articles**: long-form blog posts that orbit each video
and do the slow, compounding SEO work that YouTube will not do for you.

This is the model I use for every video on my channel.

## What a satellite article is

A satellite article is a 1,500–3,000 word blog post on your own site that covers
the same topic as a video, but in a different format. The video is the hook, the
article is the resource. They link to each other. The article ranks in Google
for long-tail terms the video will never rank for. The video ranks on YouTube
for the high-intent terms.

Together they occupy the first page of Google for your topic.

The shape:

- **YouTube video** — high-energy, on-camera, 10–25 min, watch-time optimised,
  calls-to-action friendly
- **Satellite article** — quiet, dense, scan-able, code-heavy, links-heavy,
  keyword-rich, evergreen

Both are first-class content. The video is not a "summary" of the article and
the article is not a "transcript" of the video. They are two distinct artefacts
optimised for two distinct platforms.

## Why YouTube videos do not rank in Google

Most creators assume a YouTube video will rank in Google the way a blog post
does. It will not. Three reasons:

1. **YouTube is one domain.** A search for "CalDAV MCP server" returns mostly
   blog posts, not YouTube videos, because Google's indexing treats youtube.com
   as a single authority. Your video is competing against every other video on
   the platform, not just other creators in your niche.
2. **Videos do not have keyword-stuffed body text.** The title and description
   are 200 characters. That is not enough for Google to figure out what the
   video is actually about.
3. **Google indexes transcripts only reluctantly.** Some videos have
   auto-generated captions, but Google does not weight them the way it weights
   on-page text.

A blog post on your own domain, with full text, internal links, structured data,
and an RSS feed, has every SEO advantage the video does not.

## The structure I use

For every video I record, I write a satellite article on my own site the same
week. The structure is fixed so I can ship them fast.

```
# H1 — keyword-rich title, slightly different from the video title
TL;DR — 2-3 sentences summarising the answer

## Why [topic] matters
(2-3 paragraphs, no fluff, no filler)

## The 3 options
### Option A — pros, cons, when to use
### Option B — pros, cons, when to use
### Option C — pros, cons, when to use

## Real benchmarks
(code blocks, screenshots, numbers)

## My recommendation
(1 paragraph, opinionated, not wishy-washy)

## Watch the deep-dive
(embed the YouTube video, with timestamps)

## Further reading
(internal links to related articles + 2-3 external authoritative sources)
```

The video is embedded at the bottom. People who land on the article from Google
and want the visual version click through. People who land on the video from
YouTube and want the code/links version click through to the article. They feed
each other.

## Cross-linking strategy

Satellite articles are most powerful when they are not isolated. They live in a
network.

For every video+article pair, I add **3 internal links**:

1. **Up-link** — to the broader category (e.g., article on "CalDAV MCP server"
   links to the broader "MCP servers" page)
2. **Side-link** — to a sibling article (e.g., article on "CalDAV MCP server"
   links to the "MCP servers with Deno" article)
3. **Down-link** — from a more popular existing article (e.g., the "homelab
   architecture" article links to the new "CalDAV MCP" article)

The down-link is the most important. It transfers authority from a page Google
already trusts to a page it has not indexed yet. New articles rank in days, not
months.

## Keyword research that takes 10 minutes

You do not need Ahrefs or SEMrush. The free path is enough for solo creators.

1. **YouTube search autocomplete.** Type your topic into YouTube search. The
   autocomplete suggestions are the actual queries people type. Pick the 3–5
   that match your video.
2. **Google "People also ask".** Search the same topic in Google. The "People
   also ask" box gives you 4–8 long-form questions your article can answer.
3. **AnswerThePublic** (free tier, 3 searches/day). Generates 50+ question
   variations per seed keyword. Skim, pick the 5 best, ignore the rest.

Total time per article: 10 minutes. Output: a title, an outline, and a list of
long-tail keywords to weave into the body.

## What goes in the article that does not go in the video

The article should be the place for things the video cannot contain:

- **Code snippets** that the viewer can copy-paste
- **Screenshots** of dashboards, configs, terminal output
- **External links** to docs, source repos, related articles
- **Update log** at the bottom (e.g., "Updated 2026-06-23: added note about X")
  — this signals freshness to Google
- **Comments from readers** that turn into mini case studies
- **Pinned GitHub gists** linked inline

The video is the performance. The article is the textbook. Both are needed.

## The compounding math

A solo creator who ships 2 videos/month plus 2 satellite articles has, after 12
months:

- 24 videos on YouTube
- 24 blog posts on a personal domain
- 24+ cross-linked pages feeding authority
- An RSS feed that syndicates to Medium / Dev.to / Hacker News
- A growing archive that converts visitors into clients

The marginal cost of writing a satellite article for an existing video is low.
The marginal benefit is permanent. After year 2, every new video you publish is
launching into an established network, not into a void.

## When NOT to write a satellite article

I do not write satellites for:

- **Pure personal essays** (career stories, "why I left my job"). These do not
  have search intent and the article is just a transcript.
- **Time-sensitive news.** It is already outdated by the time you write.
- **Reactions / commentary** on someone else's video. There is no evergreen
  value.

For everything else — tutorials, comparisons, walkthroughs, architecture
breakdowns — the satellite article is not optional. It is the engine.

## The full publishing workflow

For each video I record, my full workflow is:

1. **Day 0** — write the outline, do 10 min of keyword research
2. **Day 1** — record the video (1 take, 1–2 hours)
3. **Day 2** — edit the video (2–3 hours, cut, captions, thumbnail)
4. **Day 3** — write the satellite article (1.5–2 hours)
5. **Day 4** — publish both, link them, post to social
6. **Day 5** — repurpose: 1 LinkedIn post, 1 X thread, 1 HN/Reddit comment

Total: 5 days per video. 24 videos a year. After 3 years, that is 72 satellite
articles feeding each other, plus 72 videos on YouTube, plus the social trail.

That is the compounding moat. The video is the visible part. The article is the
load-bearing wall.
