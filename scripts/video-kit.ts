#!/usr/bin/env -S deno run -A
/**
 * Turns a local Whisper transcript into the packaging drafts for a YouTube
 * video: title options, a description, chapters, and a companion blog draft.
 *
 * Usage:
 *   deno task video-kit <transcript-path> <slug> [campaign]
 *
 * `<slug>` is the companion blog post's slug on antonshubin.com
 * (`content/blog/<slug>.md`) and also names the output directory. Drafts are
 * written to `videos/<slug>/`: `titles.md`, `description.md`, `chapters.md`,
 * `blog-draft.md`. Nothing is uploaded or posted — this is offline text
 * processing over a transcript file, on purpose (issue #136): no API calls
 * means no network dependency and no way for a test to flake.
 *
 * Whisper itself runs outside this repository; point this script at
 * whatever `.txt` or `.srt` file it produced.
 *
 * Transcript formats:
 *   - `.srt` (SubRip) — timestamped cues, used to build real chapters.
 *   - `.txt` — plain text, no timestamps. Chapters fall back to a single
 *     `0:00 Intro` line; add real chapter marks by hand once you have timing.
 *   - anything else fails loudly, naming the file and the two formats this
 *     script understands, rather than producing empty chapters.
 *
 * Campaign name: `[campaign]` is an optional third argument. Without it,
 * the campaign is derived as `<slug>-yt`, per the `<topic>-yt` pattern in
 * `docs/utm.md` — the topic is the blog slug itself, since that is the only
 * stable, deterministic name this script has for the video's subject.
 */

import { BASE_URL } from "@/lib/config.ts";
import { buildTaggedUrl } from "./utm.ts";

const OUT_DIR = "videos";
const CHAPTER_INTERVAL_SECONDS = 60;

export interface TranscriptSegment {
  startSeconds: number;
  text: string;
}

export interface ChapterLine {
  startSeconds: number;
  label: string;
}

export interface VideoKitContext {
  slug: string;
  campaign: string;
  titleOptions: string[];
  chapters: ChapterLine[];
  summary: string;
  taggedBlogUrl: string;
}

/**
 * Picks the transcript format from the file extension. Only `.srt`
 * (timestamped) and `.txt` (plain) are supported; anything else throws,
 * naming the file and the formats this script understands, so an
 * unsupported transcript never silently produces empty chapters.
 */
export function detectTranscriptFormat(path: string): "srt" | "plain" {
  if (path.endsWith(".srt")) return "srt";
  if (path.endsWith(".txt")) return "plain";
  throw new Error(
    `Unsupported transcript format for "${path}". Expected a ".txt" ` +
      `(plain, no timestamps) or ".srt" (SubRip, timestamped) file.`,
  );
}

const SRT_TIMESTAMP = /(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

/**
 * Parses SubRip (`.srt`) text into timestamped segments. Blocks are
 * separated by a blank line; each block's first `-->` line gives the cue's
 * start time, and every non-empty line after it is the cue's text.
 * Malformed blocks (no timestamp, no text) are skipped rather than thrown
 * on, since a real Whisper `.srt` export is otherwise well-formed.
 */
export function parseSrt(text: string): TranscriptSegment[] {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\n+/);
  const segments: TranscriptSegment[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;
    const match = lines[timeLineIndex].match(SRT_TIMESTAMP);
    if (!match) continue;
    const [, hh, mm, ss, ms] = match;
    const startSeconds = Number(hh) * 3600 + Number(mm) * 60 + Number(ss) +
      Number(ms) / 1000;
    const cueText = lines.slice(timeLineIndex + 1).join(" ").trim();
    if (cueText) segments.push({ startSeconds, text: cueText });
  }
  if (segments.length === 0) {
    throw new Error("No timestamped cues found in the .srt transcript");
  }
  return segments;
}

/** Formats seconds as a YouTube chapter timestamp: `0:00`, `2:14`, `1:02:14`. */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** First few words of a cue, capitalized, used as a chapter's label. */
function chapterLabel(cueText: string, wordCount = 6): string {
  const words = cueText.trim().split(/\s+/).slice(0, wordCount).join(" ")
    .replace(/[.,;:!?]+$/, "");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds chapter marks from timestamped segments: a fixed `0:00 Intro`
 * first, then one chapter every time the transcript crosses another
 * `intervalSeconds` boundary, labeled from the cue that crossed it. This is
 * a fixed-interval heuristic, not topic detection — good enough to give a
 * video real chapter marks instead of none, and it is deterministic, which
 * a topic-clustering approach would not be.
 */
export function buildChaptersFromSegments(
  segments: TranscriptSegment[],
  intervalSeconds = CHAPTER_INTERVAL_SECONDS,
): ChapterLine[] {
  if (segments.length === 0) {
    throw new Error("No timestamped segments to build chapters from");
  }
  const chapters: ChapterLine[] = [{ startSeconds: 0, label: "Intro" }];
  let nextThreshold = intervalSeconds;
  for (const segment of segments) {
    if (segment.startSeconds >= nextThreshold) {
      chapters.push({
        startSeconds: segment.startSeconds,
        label: chapterLabel(segment.text),
      });
      nextThreshold += intervalSeconds;
    }
  }
  return chapters;
}

function formatChapterLine(chapter: ChapterLine): string {
  return `${formatTimestamp(chapter.startSeconds)} ${chapter.label}`;
}

/**
 * Pulls several candidate video titles out of the transcript's full text:
 * its first few sentences of a title-worthy length (short enough for a
 * YouTube title, long enough to say something). Several, never one, so a
 * human still picks — this script drafts, it doesn't decide.
 */
export function extractTitleOptions(fullText: string, count = 5): string[] {
  const sentences = fullText
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 15 && sentence.length <= 90);
  const options = sentences.slice(0, count);
  if (options.length === 0) {
    throw new Error(
      "Transcript has no sentence between 15 and 90 characters to use as a title candidate",
    );
  }
  return options;
}

/** First few sentences of the transcript, joined into a description paragraph. */
export function buildSummary(fullText: string, sentenceCount = 3): string {
  const sentences = fullText
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  const summary = sentences.slice(0, sentenceCount).join(" ");
  if (!summary) {
    throw new Error("Transcript has no text to summarize");
  }
  return summary;
}

/** `<slug>-yt`, the `<topic>-yt` pattern from `docs/utm.md`, unless `override` is given. */
export function deriveCampaign(slug: string, override?: string): string {
  return override && override.length > 0 ? override : `${slug}-yt`;
}

/**
 * Assembles everything the four drafts need, with no file I/O — this is
 * the seam the tests exercise directly, per `launch-kit.ts`'s pattern of
 * a pure `context()` builder plus pure `*Draft` functions.
 */
export function buildContext(
  slug: string,
  campaign: string,
  fullText: string,
  segments: TranscriptSegment[],
): VideoKitContext {
  return {
    slug,
    campaign,
    titleOptions: extractTitleOptions(fullText),
    chapters: segments.length > 0
      ? buildChaptersFromSegments(segments)
      : [{ startSeconds: 0, label: "Intro" }],
    summary: buildSummary(fullText),
    taggedBlogUrl: buildTaggedUrl(BASE_URL, `/blog/${slug}`, {
      source: "youtube",
      medium: "blog",
      campaign,
    }),
  };
}

export function titlesDraft(ctx: VideoKitContext): string {
  const lines = ctx.titleOptions.map((title, i) => `${i + 1}. ${title}`).join(
    "\n",
  );
  return `# Title options\n\n${lines}\n`;
}

export function descriptionDraft(ctx: VideoKitContext): string {
  return `${ctx.summary}\n\nFull write-up: ${ctx.taggedBlogUrl}\n`;
}

export function chaptersDraft(ctx: VideoKitContext): string {
  const lines = ctx.chapters.map(formatChapterLine).join("\n");
  return `${lines}\n`;
}

/** Front matter shape matches `content/blog/*.md` and `devtoDraft` in `launch-kit.ts`. */
export function blogDraft(ctx: VideoKitContext): string {
  return `---
title: ${JSON.stringify(ctx.titleOptions[0])}
description: ${JSON.stringify(ctx.summary)}
---

${ctx.summary}

<!-- Expand into the full companion post. -->
`;
}

/** Reads `path`, failing loudly (naming the file) instead of a raw stack trace. */
async function readTranscriptFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`Transcript file not found: "${path}"`);
    }
    throw err;
  }
}

export interface RunVideoKitOptions {
  transcriptPath: string;
  slug: string;
  campaign?: string;
  /** Overrides `videos/<slug>` — the tests use this to avoid writing into the repo. */
  outDir?: string;
}

export interface RunVideoKitResult {
  outDir: string;
  files: string[];
}

/**
 * Reads and parses the transcript, builds the packaging context, and writes
 * the four drafts. Split out from `main` so tests can call it directly
 * against a temp directory instead of a real `Deno.args` invocation.
 */
export async function runVideoKit(
  options: RunVideoKitOptions,
): Promise<RunVideoKitResult> {
  const format = detectTranscriptFormat(options.transcriptPath);
  const raw = await readTranscriptFile(options.transcriptPath);

  const { fullText, segments } = format === "srt"
    ? (() => {
      const parsedSegments = parseSrt(raw);
      return {
        fullText: parsedSegments.map((s) => s.text).join(" "),
        segments: parsedSegments,
      };
    })()
    : { fullText: raw.trim(), segments: [] as TranscriptSegment[] };

  if (!fullText) {
    throw new Error(`Transcript file "${options.transcriptPath}" is empty`);
  }

  const campaign = deriveCampaign(options.slug, options.campaign);
  const ctx = buildContext(options.slug, campaign, fullText, segments);

  const outDir = options.outDir ?? `${OUT_DIR}/${options.slug}`;
  await Deno.mkdir(outDir, { recursive: true });

  const drafts: [string, string][] = [
    ["titles.md", titlesDraft(ctx)],
    ["description.md", descriptionDraft(ctx)],
    ["chapters.md", chaptersDraft(ctx)],
    ["blog-draft.md", blogDraft(ctx)],
  ];

  const files: string[] = [];
  for (const [name, content] of drafts) {
    const path = `${outDir}/${name}`;
    await Deno.writeTextFile(path, content);
    files.push(path);
  }

  return { outDir, files };
}

async function main() {
  const [transcriptPath, slug, campaign] = Deno.args;
  if (!transcriptPath || !slug) {
    console.error(
      "Usage: deno task video-kit <transcript-path> <slug> [campaign]",
    );
    Deno.exit(1);
  }

  let result: RunVideoKitResult;
  try {
    result = await runVideoKit({ transcriptPath, slug, campaign });
  } catch (err) {
    console.error(`\n  ✗ ${(err as Error).message}\n`);
    Deno.exit(1);
    return;
  }

  for (const path of result.files) {
    console.log(`  ✓ ${path}`);
  }
  console.log(
    `\n  ✅ Video kit ready in ${result.outDir}/ — drafts only, nothing was uploaded.\n`,
  );
}

if (import.meta.main) {
  await main();
}
