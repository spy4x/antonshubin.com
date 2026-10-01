import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import { join } from "@std/path";
import { FIXTURE_SECONDS } from "./video-cut-fixture.ts";

/**
 * End to end: a generated 80 s clip (ffmpeg testsrc and a sine tone) goes
 * through `prepare` and `render`. `deno task test` lets a test run only
 * `deno`, so ffmpeg runs inside child `deno` processes. A machine without
 * ffmpeg fails the fixture step with the error, never skips.
 */

async function deno(
  args: string[],
): Promise<{ code: number; out: string; err: string }> {
  const r = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", ...args],
    env: { VIDEO_CUT_PRESET: "ultrafast" },
    stdout: "piped",
    stderr: "piped",
  }).output();
  const dec = new TextDecoder();
  return { code: r.code, out: dec.decode(r.stdout), err: dec.decode(r.stderr) };
}

const script = (name: string) => new URL(name, import.meta.url).pathname;

Deno.test("video-cut turns a clip and an edit list into the cut, two Shorts, captions and a Kdenlive project", async (t) => {
  const dir = await Deno.makeTempDir({ prefix: "video-cut-test-" });
  try {
    const clip = join(dir, "clip.mp4");
    const whisper = join(dir, "whisper.json");
    const edit = join(dir, "edit.json");
    const cutDir = join(dir, "kit", "cut");

    const fixture = await deno([script("video-cut-fixture.ts"), dir]);
    assertEquals(
      fixture.code,
      0,
      `fixture failed (is ffmpeg installed?): ${fixture.err}`,
    );

    await t.step(
      "prepare writes the brief with numbered segments and the silences",
      async () => {
        const r = await deno([
          script("video-cut.ts"),
          "prepare",
          whisper,
          clip,
          "demo",
          "--out",
          cutDir,
        ]);
        assertEquals(r.code, 0, r.err);
        const brief = await Deno.readTextFile(join(cutDir, "edit-brief.md"));
        assertStringIncludes(brief, `${FIXTURE_SECONDS} s long`);
        assertStringIncludes(
          brief,
          "[1] 0.0–2.4 s  word0 word1 word2 word3 word4.",
        );
        assertStringIncludes(brief, "The 2 long silences");
        const silences = JSON.parse(
          await Deno.readTextFile(join(cutDir, "silences.json")),
        );
        assertEquals(silences, [
          { start: 20.1, end: 22.8, reason: "silence" },
          { start: 78.1, end: 80, reason: "silence" },
        ]);
      },
    );

    await t.step(
      "render refuses a bad edit list and names the range",
      async () => {
        const bad = join(dir, "bad.json");
        await Deno.writeTextFile(
          bad,
          JSON.stringify({
            cuts: [{ start: 70, end: 99, reason: "filler" }],
            chapters: [{ start: 0, title: "x" }],
            shorts: [],
          }),
        );
        const r = await deno([
          script("video-cut.ts"),
          "render",
          whisper,
          clip,
          "demo",
          bad,
        ]);
        assertEquals(r.code, 1);
        assertStringIncludes(r.err, "cuts[0] 70–99 s: outside the media");
      },
    );

    const render = await deno([
      script("video-cut.ts"),
      "render",
      whisper,
      clip,
      "demo",
      edit,
      "--burn",
      "--json",
      "--out",
      cutDir,
    ]);
    assertEquals(render.code, 0, render.err);
    const result = JSON.parse(render.out) as {
      long: { seconds: number };
      shorts: { seconds: number; width: number; height: number }[];
    };
    const near = (actual: number, expected: number) =>
      assert(
        Math.abs(actual - expected) < 0.15,
        `${actual} is not within 0.15 s of ${expected}`,
      );

    await t.step(
      "the long cut is the clip less the silences and edit cuts",
      () => {
        // 80 s less 2.7 + 1.9 s of silence, 0.4 s filler and 2 s retake.
        near(result.long.seconds, 73);
      },
    );

    await t.step(
      "each Short is 9:16 at 1080x1920 and as long as the list says after cuts",
      () => {
        assertEquals(result.shorts.map((s) => [s.width, s.height]), [[
          1080,
          1920,
        ], [1080, 1920]]);
        near(result.shorts[0].seconds, 33.3);
        near(result.shorts[1].seconds, 31);
      },
    );

    await t.step(
      "captions: SRT on the cut timeline, ASS in phone pixels, a burned long cut",
      async () => {
        const srt = await Deno.readTextFile(join(cutDir, "long.srt"));
        assert(!/\bum\b/.test(srt), "the cut filler must not be captioned");
        assertStringIncludes(srt, "1\n00:00:00,000 --> ");
        const ends = [...srt.matchAll(/--> (\d+):(\d+):(\d+),(\d+)/g)].map((
          m,
        ) => +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000);
        assert(
          Math.max(...ends) <= result.long.seconds + 0.1,
          "a cue ends after the video does",
        );
        const ass = await Deno.readTextFile(join(cutDir, "short-1.ass"));
        assertStringIncludes(ass, "PlayResY: 1920");
        assertStringIncludes(ass, "Style: Default,DejaVu Sans,64,");
        assert((await Deno.stat(join(cutDir, "long-captioned.mp4"))).size > 0);
      },
    );

    await t.step(
      "the Kdenlive project holds the four kept ranges and the chapter guides",
      async () => {
        const xml = await Deno.readTextFile(join(cutDir, "demo.kdenlive"));
        const entries = [
          ...xml.matchAll(
            /<entry producer="producer_v" in="(\d+)" out="(\d+)"\/>/g,
          ),
        ];
        // Kept: 0–5, 5.4–20.1, 22.8–50, 52–78.1 at 25 fps.
        assertEquals(entries.map((e) => [+e[1], +e[2]]), [
          [0, 124],
          [135, 502],
          [570, 1249],
          [1300, 1951],
        ]);
        assertStringIncludes(xml, `&quot;comment&quot;:&quot;Middle&quot;`);
      },
    );

    await t.step(
      "the video kit gets the edited transcript and the chapter marks",
      async () => {
        const chapters = await Deno.readTextFile(
          join(dir, "kit", "chapters.md"),
        );
        assertEquals(chapters, "0:00 Start\n0:26 Middle\n0:54 End\n");
        assert((await Deno.stat(join(dir, "kit", "titles.md"))).size > 0);
      },
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
