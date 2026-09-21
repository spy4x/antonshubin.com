# Video kit

`deno task video-kit <transcript-path> <slug> [campaign]` turns a local Whisper
transcript into the packaging drafts a YouTube video needs: title options, a
description, chapters and a companion blog draft. It is offline text processing
over the transcript file — no API calls, nothing uploaded or posted, so it is
fully testable without a network connection.

`<slug>` is the companion blog post's slug on antonshubin.com
(`content/blog/<slug>.md`) and also names the output directory. Drafts land in
`videos/<slug>/`:

- `titles.md` — the transcript's first five sentences of between 15 and 90
  characters, numbered, in the order they occur — candidate titles, not finished
  ones, for a human to pick from and clean up
- `description.md` — those same first sentences (up to three) as a summary
  paragraph, followed by the UTM-tagged link to the companion blog post
- `chapters.md` — timestamped chapter lines in YouTube's format (`0:00 Intro`)
- `blog-draft.md` — a draft for `content/blog/`, with YAML front matter carrying
  a `title` and a `description`. It is not ready for `deno task publish:blog` as
  written — see below.

`videos/` is gitignored and excluded from `deno fmt`/`deno lint` in `deno.json`,
the same way `launches/` is for `launch-kit.ts` — generated drafts aren't source
and shouldn't reach the public history.

## Where the transcript comes from

Whisper produces the transcript; it runs outside this repository. Point this
script at whatever file it wrote.

## Transcript formats

- `.srt` (SubRip) — timestamped cues. Real chapters are built from the
  timestamps: one every 60 seconds of transcript time, labeled from the cue that
  crossed the boundary.
- `.txt` — plain text, no timestamps. Whisper's plain-text output has none, so
  chapters fall back to a single `0:00 Intro` line. Add real chapter marks by
  hand once you know the timing.
- Anything else (including `.vtt`) fails loudly, naming the file and the two
  formats above, instead of silently producing empty chapters.

## Campaign name

`[campaign]` is an optional third argument. Without it, the campaign is derived
as `<slug>-yt`, following the `<topic>-yt` pattern in [`docs/utm.md`](./utm.md)
— the topic is the blog slug itself, the only stable, deterministic name this
script has for the video's subject.

## The UTM rule

Every link the script writes back to antonshubin.com is built with
`buildTaggedUrl` from `scripts/utm.ts`, carrying exactly the three parameters
`docs/utm.md` requires (`utm_source=youtube`, `utm_medium=blog`,
`utm_campaign=<slug>-yt` or the override), with no trailing slash on the path.

## The blog draft is not publishable as-is

`blog-draft.md` only carries `title` and `description` in its front matter.
`deno task publish:blog` also requires `category` and `publishedAt`, and exits 1
with "Missing required front matter" without them. This is deliberate:
`category` (`dev-tips` | `startups` | `personal`) and `publishedAt` are
editorial decisions this script has no way to make, and a guessed placeholder
risks being copy-pasted straight through `publish:blog` unnoticed. Fill in both
by hand before publishing.
