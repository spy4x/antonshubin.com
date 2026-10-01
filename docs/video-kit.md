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
  paragraph, followed by the tagged link to the companion blog post
- `chapters.md` — timestamped chapter lines in YouTube's format (`0:00 Intro`)
- `blog-draft.md` — a draft for `content/blog/`, with YAML front matter carrying
  a `title` and a `description`. It is not a finished post as written — see
  below.

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

## The tagged link

Every link the script writes back to antonshubin.com is the `youtube` row of the
channel table in `scripts/utm.ts` (see [`docs/utm.md`](./utm.md)):
`utm_source=youtube`, `utm_medium=video`, `utm_campaign=<slug>-yt` or the
override, with no trailing slash on the path. The campaign must be lowercase
kebab-case, or the script fails.

## The blog draft is not publishable as-is

`blog-draft.md` only carries `title` and `description` in its front matter. A
post also needs `publishedAt`, `readTime` and `previewImageURL`, a `lib/data.ts`
entry with a `category`, and a cover — editorial decisions this script has no
way to make. Finish it by hand and publish it through the flow in
[publishing.md](publishing.md); `deno task publish:blog` runs only after the
post is merged and deployed.

## The cut step: `deno task video-cut`

`scripts/video-cut.ts` (#349) edits the recording itself, before the packaging
above. It needs `ffmpeg` and `ffprobe` on the machine (libass for captions, and
the DejaVu Sans font); a missing tool fails with its name. Nothing is uploaded
and no API is called: Claude runs in your own Claude Code session, between the
two commands.

1. Transcribe with whisper.cpp and its `--output-json-full` flag, which writes
   word timestamps (a `.json` next to the audio).
2. `deno task video-cut prepare <whisper.json> <media> <slug> [--min-silence 0.8]`
   writes `videos/<slug>/cut/edit-brief.md` and `silences.json`. The script has
   already decided the silences: any gap between two words longer than the
   threshold (default 0.8 s, at least 0.3) is cut, keeping 0.2 s of quiet on
   each side. The brief is a short instruction plus the transcript as numbered
   segments with their times.
3. In a Claude Code session, give Claude `edit-brief.md` and save its JSON reply
   as a file (say `edit.json`). The list holds ranges in source seconds: `cuts`
   (each with a `reason` of `filler`, `retake` or `off-topic`; `silence` is also
   accepted), `chapters` (the first at 0) and exactly two `shorts` of 30 to 55 s
   after the cuts.
4. `deno task video-cut render <whisper.json> <media> <slug> <edit.json> [--burn]`
   checks the list first. A bad range stops the run, naming it and why:
   `cuts[1] 5.5–8 s: overlaps with the range before it (5–6 s)`. It reads the
   silences `prepare` wrote to `silences.json` (there is no `--min-silence` on
   `render`), and stops with a message naming `prepare` if the file is missing.
   Then it writes, in `videos/<slug>/cut/`:
   - `long.mp4`: the media with the silences and the listed cuts removed;
   - `long.srt`: captions on the cut timeline (`--burn` also writes
     `long-captioned.mp4`);
   - `short-1.mp4`, `short-2.mp4`: 1080x1920 (9:16, centre crop) with burned
     captions of at most four words, 64 px letters, 420 px above the bottom edge
     so a phone's buttons stay clear; their `.srt` and `.ass` files too;
   - `<slug>.kdenlive`: a Kdenlive project of the long cut. The source is in the
     bin, the kept ranges are entries on one video and one audio track, and the
     chapters are guides. Open it in Kdenlive and finish the edit there.
5. It then runs the packaging above on `long.srt`, so `titles.md`,
   `description.md` and `blog-draft.md` come from the edited transcript, and
   `chapters.md` holds the chapter marks from the edit list, on the cut
   timeline.

`--out <dir>` changes the cut directory (the packaging drafts go to its parent),
and `--json` prints the measured durations. The encoder preset is `veryfast`;
`VIDEO_CUT_PRESET` overrides it.

The Kdenlive file is written in the MLT format Kdenlive reads (document version
1.1), but this repository's tests check its structure, not that Kdenlive opens
it. If a Kdenlive version refuses it, `ffmpeg`'s cut (`long.mp4`) is still
correct and the fallback is OpenTimelineIO.

Tests (`scripts/video-cut.test.ts`) generate an 80 s clip with ffmpeg's
`testsrc` and a sine tone and run the whole flow offline. `deno task test` lets
a test run only `deno`, so the test starts the script as a child `deno` process
with its own permissions; CI installs ffmpeg in `.woodpecker.yml`. A machine
without ffmpeg fails the test, never skips it.
