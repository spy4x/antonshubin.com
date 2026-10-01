#!/usr/bin/env -S deno run -A
/**
 * The cut step of the video kit (#349). Two commands, `prepare` and
 * `render`; the person runs Claude in between. See `docs/video-kit.md`.
 *
 *   deno task video-cut prepare <whisper.json> <media> <slug> [--min-silence 0.8]
 *   deno task video-cut render <whisper.json> <media> <slug> <edit-list.json>
 *     [--burn] [--out <dir>] [--json]
 *
 * Output goes to `videos/<slug>/cut/` (gitignored). Nothing is uploaded and
 * no API is called: ffmpeg and ffprobe run on this machine.
 */

import { dirname, join, resolve } from "@std/path";
import {
  buildCues,
  buildKdenlive,
  type Chapter,
  type Cut,
  DEFAULT_MIN_SILENCE_SECONDS,
  editBrief,
  keepRanges,
  LONG_CUES,
  mergeRanges,
  parseWhisperJson,
  type Range,
  SHORT_CUES,
  silenceCuts,
  toAss,
  toCutTime,
  toSrt,
  validateEditList,
} from "./video-cut-lib.ts";
import { formatTimestamp, runVideoKit } from "./video-kit.ts";

const SHORT_WIDTH = 1080;
const SHORT_HEIGHT = 1920;
/** x264 preset; the tests set `VIDEO_CUT_PRESET=ultrafast` to finish quickly. */
function encodePreset(): string {
  return Deno.env.get("VIDEO_CUT_PRESET") ?? "veryfast";
}

/** Kept ranges shorter than this are dropped: a cut that leaves a one-frame sliver adds nothing. */
const MIN_KEEP_SECONDS = 0.1;

export interface MediaInfo {
  seconds: number;
  width: number;
  height: number;
  fpsNum: number;
  fpsDen: number;
  hasAudio: boolean;
}

interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

async function run(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<RunResult> {
  let out: Deno.CommandOutput;
  try {
    out = await new Deno.Command(cmd, {
      args,
      cwd,
      stdout: "piped",
      stderr: "piped",
    }).output();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(
        `"${cmd}" is not installed or not on PATH. The cut step needs ffmpeg and ffprobe.`,
      );
    }
    throw err;
  }
  const dec = new TextDecoder();
  return {
    success: out.success,
    stdout: dec.decode(out.stdout),
    stderr: dec.decode(out.stderr),
  };
}

/** Runs ffmpeg; on failure throws with the end of its log. */
async function ffmpeg(args: string[], cwd?: string): Promise<void> {
  const r = await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    ...args,
  ], cwd);
  if (!r.success) {
    throw new Error(
      `ffmpeg failed (${args.join(" ").slice(0, 200)}):\n${
        r.stderr.slice(-1500)
      }`,
    );
  }
}

/** Reads the facts the cut needs from a media file with ffprobe. */
export async function probe(path: string): Promise<MediaInfo> {
  const r = await run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    path,
  ]);
  if (!r.success) {
    throw new Error(
      `ffprobe could not read "${path}":\n${r.stderr.slice(-500)}`,
    );
  }
  const data = JSON.parse(r.stdout) as {
    format: { duration?: string };
    streams: {
      codec_type: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
    }[];
  };
  const video = data.streams.find((s) => s.codec_type === "video");
  if (!video) throw new Error(`"${path}" has no video stream.`);
  const [num, den] = (video.r_frame_rate ?? "25/1").split("/").map(Number);
  return {
    seconds: Number(data.format.duration),
    width: video.width ?? 0,
    height: video.height ?? 0,
    fpsNum: num || 25,
    fpsDen: den || 1,
    hasAudio: data.streams.some((s) => s.codec_type === "audio"),
  };
}

/**
 * An ffmpeg filter graph that keeps the given source ranges and joins them,
 * ending in the labels `[v]` (and `[a]` with audio). `videoTail` is appended
 * to the video chain (crop, scale, captions).
 */
export function trimConcatGraph(
  keeps: Range[],
  hasAudio: boolean,
  videoTail = "",
): string {
  const parts: string[] = [];
  keeps.forEach((k, i) => {
    parts.push(
      `[0:v]trim=start=${k.start}:end=${k.end},setpts=PTS-STARTPTS[v${i}]`,
    );
    if (hasAudio) {
      parts.push(
        `[0:a]atrim=start=${k.start}:end=${k.end},asetpts=PTS-STARTPTS[a${i}]`,
      );
    }
  });
  const inputs = keeps.map((_, i) => hasAudio ? `[v${i}][a${i}]` : `[v${i}]`)
    .join("");
  const outs = hasAudio ? "[vc][a]" : "[vc]";
  parts.push(
    `${inputs}concat=n=${keeps.length}:v=1:a=${hasAudio ? 1 : 0}${outs}`,
  );
  parts.push(`[vc]${videoTail || "null"}[v]`);
  return parts.join(";\n");
}

async function renderGraph(
  media: string,
  graph: string,
  hasAudio: boolean,
  out: string,
  dir: string,
): Promise<void> {
  const script = `${out}.filter.txt`;
  await Deno.writeTextFile(join(dir, script), graph);
  try {
    await ffmpeg([
      "-i",
      resolve(media),
      "-filter_complex_script",
      script,
      "-map",
      "[v]",
      ...(hasAudio ? ["-map", "[a]"] : []),
      "-c:v",
      "libx264",
      "-preset",
      encodePreset(),
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      ...(hasAudio ? ["-c:a", "aac", "-b:a", "160k"] : []),
      "-movflags",
      "+faststart",
      out,
    ], dir);
  } finally {
    await Deno.remove(join(dir, script)).catch(() => {});
  }
}

export interface RenderOptions {
  whisperPath: string;
  mediaPath: string;
  slug: string;
  editListPath: string;
  burn: boolean;
  /** Directory for the cut files; the kit's drafts go to its parent. */
  outDir: string;
}

export interface RenderResult {
  outDir: string;
  files: string[];
  long: { seconds: number };
  shorts: { seconds: number; width: number; height: number }[];
  chapters: Chapter[];
}

/**
 * The silences `prepare` cut and showed to Claude. `render` reuses them rather
 * than recomputing from a threshold, so the cut always matches the brief.
 */
async function readSilences(outDir: string): Promise<Cut[]> {
  const path = join(outDir, "silences.json");
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(
        `"${path}" is missing. Run "deno task video-cut prepare" first: it decides the silences and writes the brief.`,
      );
    }
    throw err;
  }
  const silences = JSON.parse(text) as Cut[];
  if (!Array.isArray(silences)) {
    throw new Error(`"${path}" must hold a list of cuts.`);
  }
  return silences;
}

/** A slug names a directory under `videos/`, so it may not point anywhere else. */
export function assertSlug(slug: string): void {
  if (slug === "" || /[\\/]/.test(slug) || slug.includes("..")) {
    throw new Error(
      `The slug "${slug}" must be one plain name: no "/", "\\" or "..".`,
    );
  }
}

/** Renders every output of the cut step and hands the edited transcript to the video kit. */
export async function renderCut(options: RenderOptions): Promise<RenderResult> {
  const media = await probe(options.mediaPath);
  const { words } = parseWhisperJson(
    await Deno.readTextFile(options.whisperPath),
  );
  const silences = await readSilences(options.outDir);

  let rawList: unknown;
  try {
    rawList = JSON.parse(await Deno.readTextFile(options.editListPath));
  } catch (err) {
    throw new Error(
      `The edit list "${options.editListPath}" is not readable JSON: ${
        (err as Error).message
      }`,
    );
  }
  const list = validateEditList(rawList, media.seconds, silences);

  const cuts: Range[] = mergeRanges([...silences, ...list.cuts]);
  const keeps = keepRanges(cuts, 0, media.seconds).filter((k) =>
    k.end - k.start >= MIN_KEEP_SECONDS
  );
  if (keeps.length === 0) throw new Error(`The cuts remove the whole video.`);

  const dir = options.outDir;
  await Deno.mkdir(dir, { recursive: true });
  const files: string[] = [];
  const emit = (name: string) => {
    files.push(join(dir, name));
    return name;
  };

  // Long cut and its captions.
  await renderGraph(
    options.mediaPath,
    trimConcatGraph(keeps, media.hasAudio),
    media.hasAudio,
    emit("long.mp4"),
    dir,
  );
  const longSrt = toSrt(buildCues(words, keeps, LONG_CUES));
  await Deno.writeTextFile(join(dir, emit("long.srt")), longSrt);
  if (options.burn) {
    // Letters 1/18 of the frame height, near the bottom.
    await Deno.writeTextFile(
      join(dir, "long.ass"),
      toAss(buildCues(words, keeps, LONG_CUES), {
        width: media.width,
        height: media.height,
        fontSize: Math.round(media.height / 18),
        marginBottom: Math.round(media.height / 16),
        marginSide: Math.round(media.width / 16),
      }),
    );
    await ffmpeg([
      "-i",
      "long.mp4",
      "-vf",
      "ass=long.ass",
      "-c:v",
      "libx264",
      "-preset",
      encodePreset(),
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      emit("long-captioned.mp4"),
    ], dir);
  }

  // Shorts: 9:16 centre crop, captions burned in for phones.
  const shortFacts: RenderResult["shorts"] = [];
  for (const [i, short] of list.shorts.entries()) {
    const n = i + 1;
    const shortKeeps = keepRanges(cuts, short.start, short.end).filter((k) =>
      k.end - k.start >= MIN_KEEP_SECONDS
    );
    const srtName = emit(`short-${n}.srt`);
    await Deno.writeTextFile(
      join(dir, srtName),
      toSrt(buildCues(words, shortKeeps, SHORT_CUES)),
    );
    // Phone captions: 64 px letters, 420 px above the bottom edge, clear of the app's buttons.
    const cues = buildCues(words, shortKeeps, SHORT_CUES);
    const assName = emit(`short-${n}.ass`);
    await Deno.writeTextFile(
      join(dir, assName),
      toAss(cues, {
        width: SHORT_WIDTH,
        height: SHORT_HEIGHT,
        fontSize: 64,
        marginBottom: 420,
        marginSide: 60,
      }),
    );
    const tail =
      `crop=floor(ih*9/16/2)*2:ih,scale=${SHORT_WIDTH}:${SHORT_HEIGHT},ass=${assName}`;
    await renderGraph(
      options.mediaPath,
      trimConcatGraph(shortKeeps, media.hasAudio, tail),
      media.hasAudio,
      emit(`short-${n}.mp4`),
      dir,
    );
    const info = await probe(join(dir, `short-${n}.mp4`));
    shortFacts.push({
      seconds: info.seconds,
      width: info.width,
      height: info.height,
    });
  }

  // Chapters on the cut timeline.
  const chapters = list.chapters.map((c) => ({
    start: toCutTime(c.start, keeps),
    title: c.title,
  }));

  // Kdenlive project of the long cut.
  await Deno.writeTextFile(
    join(dir, emit(`${options.slug}.kdenlive`)),
    buildKdenlive({
      title: options.slug,
      mediaPath: resolve(options.mediaPath),
      width: media.width,
      height: media.height,
      fpsNum: media.fpsNum,
      fpsDen: media.fpsDen,
      mediaSeconds: media.seconds,
      keeps,
      chapters,
    }),
  );

  // Hand the edited transcript to the packaging step; chapters come from the edit list.
  const kitDir = dirname(dir);
  const kit = await runVideoKit({
    transcriptPath: join(dir, "long.srt"),
    slug: options.slug,
    outDir: kitDir,
  });
  const chapterLines = chapters.map((c) =>
    `${formatTimestamp(c.start)} ${c.title}`
  ).join("\n");
  await Deno.writeTextFile(join(kitDir, "chapters.md"), `${chapterLines}\n`);
  files.push(...kit.files);

  const long = await probe(join(dir, "long.mp4"));
  return {
    outDir: dir,
    files,
    long: { seconds: long.seconds },
    shorts: shortFacts,
    chapters,
  };
}

/** Writes the brief for Claude and the silences the script found. */
export async function prepareCut(options: {
  whisperPath: string;
  mediaPath: string;
  minSilence: number;
  outDir: string;
}): Promise<{ briefPath: string; silences: Cut[] }> {
  const media = await probe(options.mediaPath);
  const { words, segments } = parseWhisperJson(
    await Deno.readTextFile(options.whisperPath),
  );
  const silences = silenceCuts(words, media.seconds, options.minSilence);
  await Deno.mkdir(options.outDir, { recursive: true });
  const briefPath = join(options.outDir, "edit-brief.md");
  await Deno.writeTextFile(
    briefPath,
    editBrief(segments, silences, media.seconds),
  );
  await Deno.writeTextFile(
    join(options.outDir, "silences.json"),
    JSON.stringify(silences, null, 2) + "\n",
  );
  return { briefPath, silences };
}

function parseFlags(args: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--burn" || a === "--json") flags[a.slice(2)] = true;
    else if (a === "--min-silence" || a === "--out") {
      flags[a.slice(2)] = args[++i] ?? "";
    } else if (a.startsWith("--")) throw new Error(`Unknown option "${a}".`);
    else positional.push(a);
  }
  return { positional, flags };
}

const USAGE = `Usage:
  deno task video-cut prepare <whisper.json> <media> <slug> [--min-silence ${DEFAULT_MIN_SILENCE_SECONDS}]
  deno task video-cut render <whisper.json> <media> <slug> <edit-list.json> [--burn] [--out <dir>] [--json]`;

async function main() {
  try {
    const { positional, flags } = parseFlags(Deno.args);
    const [command, whisperPath, mediaPath, slug, editListPath] = positional;
    if (slug !== undefined) assertSlug(slug);
    if (command === "render" && flags["min-silence"] !== undefined) {
      throw new Error(
        `--min-silence belongs to "prepare"; render reuses the silences prepare wrote.`,
      );
    }
    const minSilence = flags["min-silence"] === undefined
      ? DEFAULT_MIN_SILENCE_SECONDS
      : Number(flags["min-silence"]);
    if (!(minSilence >= 0.3)) {
      throw new Error(
        `--min-silence must be a number of at least 0.3 seconds.`,
      );
    }
    const outDir = typeof flags.out === "string"
      ? flags.out
      : `videos/${slug}/cut`;
    if (command === "prepare" && whisperPath && mediaPath && slug) {
      const r = await prepareCut({
        whisperPath,
        mediaPath,
        minSilence,
        outDir,
      });
      console.log(`  ✓ ${r.briefPath} (${r.silences.length} silences cut)`);
      console.log(
        `\n  Next: run Claude Code on it, save the JSON reply, then\n  deno task video-cut render ${whisperPath} ${mediaPath} ${slug} <edit-list.json>\n`,
      );
    } else if (
      command === "render" && whisperPath && mediaPath && slug && editListPath
    ) {
      const r = await renderCut({
        whisperPath,
        mediaPath,
        slug,
        editListPath,
        burn: flags.burn === true,
        outDir,
      });
      if (flags.json) console.log(JSON.stringify(r));
      else {
        for (const f of r.files) console.log(`  ✓ ${f}`);
        console.log(
          `\n  ✅ Cut ready in ${r.outDir}/ — nothing was uploaded.\n`,
        );
      }
    } else {
      console.error(USAGE);
      Deno.exit(1);
    }
  } catch (err) {
    console.error(`\n  ✗ ${(err as Error).message}\n`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
