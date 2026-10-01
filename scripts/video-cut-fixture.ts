#!/usr/bin/env -S deno run -A
/**
 * Test support for the cut step: `deno run -A scripts/video-cut-fixture.ts <dir>`
 * writes an 80 s test clip (ffmpeg `testsrc` plus a sine tone), a matching
 * whisper.cpp `--output-json-full` file and a valid edit list into `<dir>`.
 * The tests start it as a child process, because `deno task test` only lets a
 * test run `deno`.
 */

import { join } from "@std/path";

export const FIXTURE_SECONDS = 80;
/** Word `i` starts at 0.5 i seconds and lasts 0.4 s; a 3 s pause follows word 39. */
const PAUSE_AFTER = 39;
const PAUSE_SECONDS = 3;

/** The fixture's whisper.cpp JSON text; word 10 is "um". */
export function fixtureWhisperJson(): string {
  const segments = [];
  for (let s = 0; s < 30; s++) {
    const tokens = [];
    for (let w = s * 5; w < s * 5 + 5; w++) {
      const from = Math.round(
        (0.5 * w + (w > PAUSE_AFTER ? PAUSE_SECONDS : 0)) * 1000,
      );
      tokens.push({
        text: ` ${w === 10 ? "um" : `word${w}`}${w % 5 === 4 ? "." : ""}`,
        offsets: { from, to: from + 400 },
      });
    }
    tokens.unshift({
      text: "[_BEG_]",
      offsets: { from: tokens[0].offsets.from, to: tokens[0].offsets.from },
    });
    segments.push({
      text: tokens.slice(1).map((t) => t.text).join(""),
      offsets: {
        from: tokens[1].offsets.from,
        to: tokens[tokens.length - 1].offsets.to,
      },
      tokens,
    });
  }
  return JSON.stringify({ transcription: segments });
}

/** The fixture's edit list: a filler, a retake, three chapters, two Shorts. */
export const FIXTURE_EDIT_LIST = {
  cuts: [
    { start: 5.0, end: 5.4, reason: "filler", note: "um" },
    { start: 50.0, end: 52.0, reason: "retake" },
  ],
  chapters: [
    { start: 0, title: "Start" },
    { start: 30, title: "Middle" },
    { start: 60, title: "End" },
  ],
  shorts: [
    { start: 6, end: 42, title: "First short" },
    { start: 45, end: 78, title: "Second short" },
  ],
};

if (import.meta.main) {
  const dir = Deno.args[0];
  if (!dir) throw new Error("Usage: video-cut-fixture.ts <dir>");
  const r = await new Deno.Command("ffmpeg", {
    args: [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `testsrc=size=640x360:rate=25:duration=${FIXTURE_SECONDS}`,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=440:sample_rate=44100:duration=${FIXTURE_SECONDS}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      join(dir, "clip.mp4"),
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!r.success) throw new Error(new TextDecoder().decode(r.stderr));
  await Deno.writeTextFile(join(dir, "whisper.json"), fixtureWhisperJson());
  await Deno.writeTextFile(
    join(dir, "edit.json"),
    JSON.stringify(FIXTURE_EDIT_LIST),
  );
}
