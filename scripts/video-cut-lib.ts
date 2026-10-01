/**
 * Pure helpers of the video cut step (#349): whisper.cpp word timestamps,
 * silence cuts, the edit list Claude returns, its validation, caption cues,
 * and the Kdenlive (MLT) project. Nothing here runs a process or touches a
 * file, so every function is testable offline; `video-cut.ts` does the I/O.
 */

/** A time range in seconds. */
export interface Range {
  start: number;
  end: number;
}

export interface Word extends Range {
  text: string;
}

export interface Segment extends Range {
  n: number;
  text: string;
}

export type CutReason = "silence" | "filler" | "retake" | "off-topic";

export const CUT_REASONS: readonly CutReason[] = [
  "silence",
  "filler",
  "retake",
  "off-topic",
];

export interface Cut extends Range {
  reason: CutReason;
  note?: string;
}

export interface Chapter {
  start: number;
  title: string;
}

export interface Short extends Range {
  title: string;
}

/** What Claude returns: ranges to remove, chapter marks and two Short candidates. */
export interface EditList {
  cuts: Cut[];
  chapters: Chapter[];
  shorts: Short[];
}

export const SHORT_MIN_SECONDS = 30;
export const SHORT_MAX_SECONDS = 55;
export const SHORT_COUNT = 2;
export const DEFAULT_MIN_SILENCE_SECONDS = 0.8;
/** Quiet kept on each side of a cut silence, so speech does not start abruptly. */
const SILENCE_PAD_SECONDS = 0.2;
const EPSILON = 0.001;

const ms = (seconds: number) => Math.round(seconds * 1000) / 1000;

interface WhisperToken {
  text?: string;
  offsets?: { from?: number; to?: number };
}

interface WhisperSegment {
  text?: string;
  offsets?: { from?: number; to?: number };
  tokens?: WhisperToken[];
}

/**
 * Reads whisper.cpp's `--output-json-full` file. Words come from the tokens
 * (a token starting with a space begins a word, one without it, such as a
 * comma, continues the previous word); a segment without tokens falls back to
 * its words spread evenly over its time. The special `[_BEG_]` and `[_TT_n]`
 * tokens are ignored.
 */
export function parseWhisperJson(
  text: string,
): { words: Word[]; segments: Segment[] } {
  let data: { transcription?: WhisperSegment[] };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`The Whisper file is not valid JSON.`);
  }
  if (!Array.isArray(data.transcription)) {
    throw new Error(
      `The Whisper file has no "transcription" list. Run whisper.cpp with --output-json-full.`,
    );
  }
  const words: Word[] = [];
  const segments: Segment[] = [];
  for (const seg of data.transcription) {
    const from = (seg.offsets?.from ?? 0) / 1000;
    const to = (seg.offsets?.to ?? 0) / 1000;
    const segText = (seg.text ?? "").trim();
    if (segText) {
      segments.push({
        n: segments.length + 1,
        start: from,
        end: to,
        text: segText,
      });
    }
    const tokens = (seg.tokens ?? []).filter((t) =>
      t.text !== undefined && !/^\[_[^\]]*\]$/.test(t.text.trim()) && t.offsets
    );
    if (tokens.length > 0) {
      let current: Word | undefined;
      for (const t of tokens) {
        const tStart = (t.offsets!.from ?? 0) / 1000;
        const tEnd = Math.max(tStart, (t.offsets!.to ?? 0) / 1000);
        const raw = t.text!;
        if (!current || /^\s/.test(raw)) {
          if (current) words.push(current);
          if (raw.trim() === "") {
            current = undefined;
            continue;
          }
          current = { start: tStart, end: tEnd, text: raw.trim() };
        } else {
          current.text += raw;
          current.end = Math.max(current.end, tEnd);
        }
      }
      if (current) words.push(current);
    } else if (segText) {
      const parts = segText.split(/\s+/);
      const step = (to - from) / parts.length;
      parts.forEach((p, i) =>
        words.push({
          start: from + i * step,
          end: from + (i + 1) * step,
          text: p,
        })
      );
    }
  }
  if (words.length === 0) throw new Error(`The Whisper file holds no words.`);
  return { words, segments };
}

/**
 * Silences longer than `minSilence` seconds between words (and before the
 * first or after the last word), as cuts that keep 0.2 s of quiet on each
 * side. Decided from the word times alone, so it is deterministic.
 */
export function silenceCuts(
  words: Word[],
  mediaSeconds: number,
  minSilence = DEFAULT_MIN_SILENCE_SECONDS,
): Cut[] {
  const cuts: Cut[] = [];
  const add = (start: number, end: number) => {
    if (end - start > EPSILON) {
      cuts.push({ start: ms(start), end: ms(end), reason: "silence" });
    }
  };
  if (words[0].start > minSilence) add(0, words[0].start - SILENCE_PAD_SECONDS);
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap > minSilence) {
      add(
        words[i - 1].end + SILENCE_PAD_SECONDS,
        words[i].start - SILENCE_PAD_SECONDS,
      );
    }
  }
  const last = words[words.length - 1];
  if (mediaSeconds - last.end > minSilence) {
    add(last.end + SILENCE_PAD_SECONDS, mediaSeconds);
  }
  return cuts;
}

/** Sorted union of ranges; touching or overlapping ranges become one. */
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.map((r) => ({ start: r.start, end: r.end })).sort((
    a,
    b,
  ) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end + EPSILON) {
      last.end = Math.max(last.end, r.end);
    } else merged.push(r);
  }
  return merged;
}

/** The parts of `[from, to]` that no cut removes, in order. */
export function keepRanges(cuts: Range[], from: number, to: number): Range[] {
  const keeps: Range[] = [];
  let at = from;
  for (const c of mergeRanges(cuts)) {
    if (c.end <= from || c.start >= to) continue;
    if (c.start - at > EPSILON) {
      keeps.push({ start: ms(at), end: ms(Math.min(c.start, to)) });
    }
    at = Math.max(at, c.end);
  }
  if (to - at > EPSILON) keeps.push({ start: ms(at), end: ms(to) });
  return keeps;
}

export function totalSeconds(ranges: Range[]): number {
  return ms(ranges.reduce((sum, r) => sum + (r.end - r.start), 0));
}

const fmtRange = (r: Range) => `${r.start}–${r.end} s`;

/**
 * Checks the edit list Claude returned against the media. Every problem is
 * reported with the range it concerns (`cuts[2] 41–39.5 s: ends before it
 * starts`), all at once, so one pass fixes the file. `autoCuts` are the
 * silence cuts the renderer adds, which count towards a Short's length.
 */
export function validateEditList(
  raw: unknown,
  mediaSeconds: number,
  autoCuts: Range[] = [],
): EditList {
  const problems: string[] = [];
  const obj = (raw ?? {}) as Record<string, unknown>;
  const list = (key: string): unknown[] => {
    if (!Array.isArray(obj[key])) {
      problems.push(`"${key}" must be a list.`);
      return [];
    }
    return obj[key] as unknown[];
  };
  const checkRange = (label: string, r: Record<string, unknown>): boolean => {
    const { start, end } = r;
    if (
      typeof start !== "number" || typeof end !== "number" ||
      !isFinite(start) || !isFinite(end)
    ) {
      problems.push(`${label}: start and end must be numbers (seconds).`);
      return false;
    }
    const where = `${label} ${fmtRange({ start, end })}`;
    if (start < 0 || end > mediaSeconds + EPSILON) {
      problems.push(`${where}: outside the media (0–${ms(mediaSeconds)} s).`);
      return false;
    }
    if (end <= start) {
      problems.push(`${where}: ends before it starts.`);
      return false;
    }
    return true;
  };
  const checkOrder = (label: string, previous: Range | undefined, r: Range) => {
    if (previous && r.start < previous.end - EPSILON) {
      const kind = r.start < previous.start ? "out of order" : "overlaps";
      problems.push(
        `${label} ${fmtRange(r)}: ${kind} with the range before it (${
          fmtRange(previous)
        }).`,
      );
    }
  };

  const cuts: Cut[] = [];
  list("cuts").forEach((c, i) => {
    const r = (c ?? {}) as Record<string, unknown>;
    const label = `cuts[${i}]`;
    if (!CUT_REASONS.includes(r.reason as CutReason)) {
      problems.push(
        `${label}: reason must be one of ${CUT_REASONS.join(", ")}.`,
      );
    }
    if (!checkRange(label, r)) return;
    const cut = r as unknown as Cut;
    checkOrder(label, cuts[cuts.length - 1], cut);
    cuts.push(cut);
  });

  const chapters: Chapter[] = [];
  list("chapters").forEach((c, i) => {
    const r = (c ?? {}) as Record<string, unknown>;
    const label = `chapters[${i}]`;
    if (typeof r.title !== "string" || r.title.trim() === "") {
      problems.push(`${label}: title must be a non-empty string.`);
    }
    if (typeof r.start !== "number" || r.start < 0 || r.start >= mediaSeconds) {
      problems.push(
        `${label} at ${r.start}: start must be a number inside the media.`,
      );
      return;
    }
    const prev = chapters[chapters.length - 1];
    if (prev && r.start <= prev.start) {
      problems.push(
        `${label} at ${r.start} s: not after the chapter before it (${prev.start} s).`,
      );
    }
    chapters.push(r as unknown as Chapter);
  });
  if (chapters.length === 0) {
    problems.push(`"chapters" needs at least one chapter.`);
  } else if (chapters[0].start !== 0) {
    problems.push(
      `chapters[0] at ${
        chapters[0].start
      } s: the first chapter must start at 0.`,
    );
  }

  const shorts: Short[] = [];
  const shortsRaw = list("shorts");
  if (shortsRaw.length !== SHORT_COUNT) {
    problems.push(
      `"shorts" needs exactly ${SHORT_COUNT} candidates, got ${shortsRaw.length}.`,
    );
  }
  shortsRaw.forEach((s, i) => {
    const r = (s ?? {}) as Record<string, unknown>;
    const label = `shorts[${i}]`;
    if (typeof r.title !== "string" || r.title.trim() === "") {
      problems.push(`${label}: title must be a non-empty string.`);
    }
    if (!checkRange(label, r)) return;
    const short = r as unknown as Short;
    checkOrder(label, shorts[shorts.length - 1], short);
    shorts.push(short);
    const length = totalSeconds(
      keepRanges([...autoCuts, ...cuts], short.start, short.end),
    );
    if (length < SHORT_MIN_SECONDS || length > SHORT_MAX_SECONDS) {
      problems.push(
        `${label} ${
          fmtRange(short)
        }: ${length} s after the cuts, must be ${SHORT_MIN_SECONDS}–${SHORT_MAX_SECONDS} s.`,
      );
    }
  });

  if (problems.length > 0) {
    throw new Error(`The edit list is not valid:\n- ${problems.join("\n- ")}`);
  }
  return { cuts, chapters, shorts };
}

/** Maps a source time to the cut timeline, or the next kept moment when it was cut. */
export function toCutTime(t: number, keeps: Range[]): number {
  let out = 0;
  for (const k of keeps) {
    if (t < k.start) return ms(out);
    if (t <= k.end) return ms(out + (t - k.start));
    out += k.end - k.start;
  }
  return ms(out);
}

export interface Cue extends Range {
  text: string;
}

export interface CueOptions {
  maxWords: number;
  maxChars: number;
}

export const LONG_CUES: CueOptions = { maxWords: 12, maxChars: 42 };
/** Phone captions: short lines, big letters. */
export const SHORT_CUES: CueOptions = { maxWords: 4, maxChars: 24 };

/**
 * Caption cues on the cut timeline. A word counts when its middle is kept;
 * a cue ends at sentence punctuation (after three words), at the size limits,
 * or when the speaker pauses.
 */
export function buildCues(
  words: Word[],
  keeps: Range[],
  options: CueOptions,
): Cue[] {
  const cues: Cue[] = [];
  let current: Cue | undefined;
  let count = 0;
  let offset = 0;
  const flush = () => {
    if (current) cues.push(current);
    current = undefined;
    count = 0;
  };
  for (const k of keeps) {
    for (const w of words) {
      const mid = (w.start + w.end) / 2;
      if (mid < k.start || mid >= k.end) continue;
      const start = ms(offset + Math.max(w.start, k.start) - k.start);
      const end = ms(offset + Math.min(w.end, k.end) - k.start);
      if (current) {
        const tooLong =
          current.text.length + 1 + w.text.length > options.maxChars;
        if (count >= options.maxWords || tooLong || start - current.end > 0.7) {
          flush();
        }
      }
      if (current) {
        current.text += ` ${w.text}`;
        current.end = end;
      } else {
        current = { start, end, text: w.text };
      }
      count++;
      if (count >= 3 && /[.?!]$/.test(w.text)) flush();
    }
    offset += k.end - k.start;
  }
  flush();
  return cues;
}

function srtTime(seconds: number): string {
  const total = Math.round(seconds * 1000);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(total % 1000, 3)}`;
}

export function toSrt(cues: Cue[]): string {
  return cues.map((c, i) =>
    `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`
  )
    .join("\n");
}

export interface AssStyle {
  width: number;
  height: number;
  /** Letter height in pixels of the `width` x `height` frame. */
  fontSize: number;
  /** Distance from the bottom edge to the text, in pixels. */
  marginBottom: number;
  /** Distance from the left and right edges, in pixels. */
  marginSide: number;
}

function assTime(seconds: number): string {
  const cs = Math.round(seconds * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${h}:${p(m)}:${p(s)}.${p(cs % 100)}`;
}

/**
 * Burned-in captions as an ASS file. Its play resolution is the video's own,
 * so sizes are real pixels; an SRT is read by libass at 384x288 and scaled,
 * which puts a phone-sized margin off the screen.
 */
export function toAss(cues: Cue[], style: AssStyle): string {
  const events = cues.map((c) =>
    `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${
      c.text.replace(/[{}]/g, "")
    }`
  );
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${style.width}
PlayResY: ${style.height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,${style.fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,${
    Math.max(2, Math.round(style.fontSize / 14))
  },0,2,${style.marginSide},${style.marginSide},${style.marginBottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join("\n")}
`;
}

/**
 * The file the person gives to Claude: a short instruction, the JSON shape to
 * return, and the transcript as numbered segments with their times.
 */
export function editBrief(
  segments: Segment[],
  silences: Cut[],
  mediaSeconds: number,
): string {
  const lines = segments.map((s) =>
    `[${s.n}] ${s.start.toFixed(1)}–${s.end.toFixed(1)} s  ${s.text}`
  );
  return `# Edit list request

You edit a talking-head video, ${
    ms(mediaSeconds)
  } s long. Below is its transcript as numbered
segments with source times in seconds. The ${silences.length} long silences are already cut
by a script; do not list them. Reply with one JSON object and nothing else.

- \`cuts\`: ranges to remove, in time order, never overlapping. \`reason\` is \`filler\` (um, uh,
  false starts), \`retake\` (the speaker repeats a line, cut the weaker take) or \`off-topic\`.
  Cut on word boundaries and keep the edit conservative.
- \`chapters\`: 3 to 8 marks, ordered; the first starts at 0; \`title\` is plain and specific.
- \`shorts\`: exactly ${SHORT_COUNT} self-contained moments for vertical clips. Each is
  ${SHORT_MIN_SECONDS}–${SHORT_MAX_SECONDS} s long after the cuts, starts on a hook and ends on a
  finished thought.

All times are source seconds, inside 0–${ms(mediaSeconds)}.

\`\`\`json
{
  "cuts": [{ "start": 12.4, "end": 13.1, "reason": "filler", "note": "um" }],
  "chapters": [{ "start": 0, "title": "Why I built it" }],
  "shorts": [{ "start": 40.0, "end": 82.5, "title": "The mistake that cost a week" }]
}
\`\`\`

Save the reply as a \`.json\` file and pass it to \`deno task video-cut render\`.

## Transcript

${lines.join("\n")}
`;
}

export interface KdenliveInput {
  title: string;
  mediaPath: string;
  width: number;
  height: number;
  fpsNum: number;
  fpsDen: number;
  /** Whole source length, for the bin clip. */
  mediaSeconds: number;
  keeps: Range[];
  /** Chapter marks on the cut timeline, in seconds. */
  chapters: Chapter[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
    /"/g,
    "&quot;",
  );

/**
 * A Kdenlive project (MLT XML, document version 1.1) of the cut: the source
 * in the bin, one video and one audio track holding the kept ranges back to
 * back, and the chapters as guides. Edit it in Kdenlive like any project.
 */
export function buildKdenlive(input: KdenliveInput): string {
  const fps = input.fpsNum / input.fpsDen;
  const frames = (s: number) => Math.round(s * fps);
  const sourceFrames = frames(input.mediaSeconds);
  const entries = (producer: string) =>
    input.keeps.map((k) =>
      `  <entry producer="${producer}" in="${frames(k.start)}" out="${
        Math.max(frames(k.end) - 1, frames(k.start))
      }"/>`
    ).join("\n");
  const total = input.keeps.reduce(
    (n, k) => n + Math.max(frames(k.end) - frames(k.start), 1),
    0,
  );
  const guides = JSON.stringify(
    input.chapters.map((c) => ({
      comment: c.title,
      pos: frames(c.start),
      type: 0,
    })),
  );
  const clip = (id: string, extra: string) =>
    ` <producer id="${id}" in="0" out="${sourceFrames - 1}">
  <property name="length">${sourceFrames}</property>
  <property name="eof">pause</property>
  <property name="resource">${esc(input.mediaPath)}</property>
  <property name="mlt_service">avformat-novalidate</property>
  <property name="seekable">1</property>${extra}
  <property name="kdenlive:id">2</property>
 </producer>`;
  return `<?xml version="1.0" encoding="utf-8"?>
<mlt LC_NUMERIC="C" version="7.22.0" title="${
    esc(input.title)
  }" producer="main_bin">
 <profile description="${input.width}x${input.height} ${
    fps.toFixed(2)
  } fps" width="${input.width}" height="${input.height}" progressive="1" sample_aspect_num="1" sample_aspect_den="1" display_aspect_num="${input.width}" display_aspect_den="${input.height}" frame_rate_num="${input.fpsNum}" frame_rate_den="${input.fpsDen}" colorspace="709"/>
${
    clip(
      "producer0",
      `\n  <property name="kdenlive:clip_type">0</property>\n  <property name="kdenlive:folderid">-1</property>`,
    )
  }
${clip("producer_v", `\n  <property name="set.test_audio">1</property>`)}
${clip("producer_a", `\n  <property name="set.test_image">1</property>`)}
 <playlist id="playlist_a">
  <property name="kdenlive:audio_track">1</property>
  <property name="kdenlive:track_name">Audio</property>
${entries("producer_a")}
 </playlist>
 <tractor id="tractor_a" in="0" out="${total - 1}">
  <property name="kdenlive:audio_track">1</property>
  <property name="kdenlive:trackheight">67</property>
  <track hide="video" producer="playlist_a"/>
 </tractor>
 <playlist id="playlist_v">
  <property name="kdenlive:track_name">Video</property>
${entries("producer_v")}
 </playlist>
 <tractor id="tractor_v" in="0" out="${total - 1}">
  <property name="kdenlive:trackheight">67</property>
  <track hide="audio" producer="playlist_v"/>
 </tractor>
 <playlist id="main_bin">
  <property name="kdenlive:docproperties.version">1.1</property>
  <property name="kdenlive:docproperties.guides">${esc(guides)}</property>
  <property name="kdenlive:docproperties.profile">${input.width}x${input.height}</property>
  <entry producer="producer0" in="0" out="${sourceFrames - 1}"/>
 </playlist>
 <producer id="black_track" in="0" out="${total - 1}">
  <property name="resource">black</property>
  <property name="mlt_service">color</property>
  <property name="set.test_audio">0</property>
 </producer>
 <tractor id="tractor_main" in="0" out="${total - 1}">
  <property name="kdenlive:projectTractor">1</property>
  <track producer="black_track"/>
  <track producer="tractor_a"/>
  <track producer="tractor_v"/>
  <transition mlt_service="mix" a_track="0" b_track="1" always_active="1" sum="1"/>
  <transition mlt_service="qtblend" a_track="0" b_track="2" compositing="0" distort="0" rotate_center="0"/>
 </tractor>
</mlt>
`;
}
