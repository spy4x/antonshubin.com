import {
  assert,
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import {
  buildCues,
  buildKdenlive,
  editBrief,
  keepRanges,
  mergeRanges,
  parseWhisperJson,
  silenceCuts,
  toAss,
  toCutTime,
  toSrt,
  validateEditList,
  type Word,
} from "./video-cut-lib.ts";
import { assertSlug, trimConcatGraph } from "./video-cut.ts";

const tok = (text: string, from: number, to: number) => ({
  text,
  offsets: { from, to },
});

Deno.test("parseWhisperJson joins punctuation tokens to their word and skips special tokens", () => {
  const json = JSON.stringify({
    transcription: [{
      text: " Hello, world.",
      offsets: { from: 0, to: 1500 },
      tokens: [
        tok("[_BEG_]", 0, 0),
        tok(" Hello", 100, 600),
        tok(",", 600, 650),
        tok(" world", 700, 1200),
        tok(".", 1200, 1250),
        tok("[_TT_75]", 1500, 1500),
      ],
    }],
  });
  const { words, segments } = parseWhisperJson(json);
  assertEquals(words, [
    { start: 0.1, end: 0.65, text: "Hello," },
    { start: 0.7, end: 1.25, text: "world." },
  ]);
  assertEquals(segments, [{ n: 1, start: 0, end: 1.5, text: "Hello, world." }]);
});

Deno.test("parseWhisperJson spreads a segment without tokens evenly over its time", () => {
  const { words } = parseWhisperJson(JSON.stringify({
    transcription: [{ text: " one two", offsets: { from: 1000, to: 3000 } }],
  }));
  assertEquals(words, [
    { start: 1, end: 2, text: "one" },
    { start: 2, end: 3, text: "two" },
  ]);
});

Deno.test("parseWhisperJson says to use --output-json-full when there is no transcription", () => {
  assertThrows(
    () => parseWhisperJson(`{"result":{}}`),
    Error,
    "--output-json-full",
  );
  assertThrows(() => parseWhisperJson(`not json`), Error, "not valid JSON");
});

const words: Word[] = [
  { start: 0.1, end: 0.5, text: "a" },
  { start: 0.6, end: 1.0, text: "b" },
  { start: 3.0, end: 3.4, text: "c" },
];

Deno.test("silenceCuts cuts only gaps longer than the threshold and keeps 0.2 s each side", () => {
  const cuts = silenceCuts(words, 3.5, 0.8);
  assertEquals(cuts, [{ start: 1.2, end: 2.8, reason: "silence" }]);
  assertEquals(silenceCuts(words, 3.5, 2.5), []);
});

Deno.test("silenceCuts cuts a long lead-in and a long tail", () => {
  const cuts = silenceCuts([{ start: 2, end: 3, text: "x" }], 10, 0.8);
  assertEquals(cuts, [
    { start: 0, end: 1.8, reason: "silence" },
    { start: 3.2, end: 10, reason: "silence" },
  ]);
});

Deno.test("keepRanges returns what the merged cuts leave inside the window", () => {
  const cuts = [{ start: 2, end: 4 }, { start: 3, end: 5 }, {
    start: 8,
    end: 9,
  }];
  assertEquals(mergeRanges(cuts), [{ start: 2, end: 5 }, { start: 8, end: 9 }]);
  assertEquals(keepRanges(cuts, 0, 10), [
    { start: 0, end: 2 },
    { start: 5, end: 8 },
    { start: 9, end: 10 },
  ]);
  assertEquals(keepRanges(cuts, 3, 8.5), [{ start: 5, end: 8 }]);
});

Deno.test("toCutTime shifts a time by the cuts before it and moves a cut time to the next kept one", () => {
  const keeps = [{ start: 0, end: 2 }, { start: 5, end: 8 }];
  assertEquals(toCutTime(1, keeps), 1);
  assertEquals(toCutTime(6, keeps), 3);
  assertEquals(toCutTime(3, keeps), 2);
});

const goodList = {
  cuts: [{ start: 5, end: 6, reason: "filler" }, {
    start: 20,
    end: 22,
    reason: "retake",
  }],
  chapters: [{ start: 0, title: "Start" }, { start: 40, title: "Later" }],
  shorts: [{ start: 10, end: 50, title: "A" }, {
    start: 60,
    end: 95,
    title: "B",
  }],
};
type Loose = Record<string, unknown>;
const clone = () =>
  structuredClone(goodList) as unknown as {
    cuts: Loose[];
    chapters: Loose[];
    shorts: Loose[];
  };

Deno.test("validateEditList accepts a well-formed list", () => {
  assertEquals(validateEditList(goodList, 100).shorts.length, 2);
});

Deno.test("validateEditList names an overlapping cut by its range", () => {
  const list = clone();
  list.cuts[1] = { start: 5.5, end: 8, reason: "filler" };
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "cuts[1] 5.5–8 s: overlaps with the range before it (5–6 s)",
  );
});

Deno.test("validateEditList names a cut that is out of order", () => {
  const list = clone();
  list.cuts = [{ start: 20, end: 22, reason: "retake" }, {
    start: 5,
    end: 6,
    reason: "filler",
  }];
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "cuts[1] 5–6 s: out of order",
  );
});

Deno.test("validateEditList names a range outside the media and one that ends before it starts", () => {
  const list = clone();
  list.cuts = [{ start: 90, end: 120, reason: "filler" }];
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "cuts[0] 90–120 s: outside the media",
  );
  list.cuts = [{ start: 9, end: 8, reason: "filler" }];
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "cuts[0] 9–8 s: ends before it starts",
  );
});

Deno.test("validateEditList rejects a reason outside the four allowed", () => {
  const list = clone();
  list.cuts[0].reason = "boring";
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "cuts[0]: reason must be one of",
  );
});

Deno.test("validateEditList measures a Short after the cuts, silences included", () => {
  const list = clone();
  // 10–50 is 40 s; the 20–22 retake leaves 38. A silence cut over 25–50 leaves 13 s.
  assertEquals(validateEditList(list, 100).shorts[0].end, 50);
  assertThrows(
    () => validateEditList(list, 100, [{ start: 25, end: 58 }]),
    Error,
    "shorts[0] 10–50 s: 13 s after the cuts, must be 30–55 s",
  );
  list.shorts[1] = { start: 20, end: 99, title: "B" };
  assertThrows(() => validateEditList(list, 100), Error, "shorts[1] 20–99 s");
});

Deno.test("validateEditList needs two Shorts and a first chapter at 0", () => {
  const list = clone();
  list.shorts.pop();
  list.chapters[0].start = 3;
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    `"shorts" needs exactly 2`,
  );
  assertThrows(
    () => validateEditList(list, 100),
    Error,
    "chapters[0] at 3 s: the first chapter",
  );
});

Deno.test("buildCues drops words in cuts, shifts the rest onto the cut timeline and splits at sentence ends", () => {
  const w: Word[] = [
    { start: 0, end: 0.4, text: "one" },
    { start: 0.5, end: 0.9, text: "two" },
    { start: 1.0, end: 1.4, text: "three." },
    { start: 1.5, end: 1.9, text: "cut" },
    { start: 5.0, end: 5.4, text: "four" },
  ];
  const cues = buildCues(w, [{ start: 0, end: 1.5 }, { start: 5, end: 6 }], {
    maxWords: 12,
    maxChars: 42,
  });
  assertEquals(cues, [
    { start: 0, end: 1.4, text: "one two three." },
    { start: 1.5, end: 1.9, text: "four" },
  ]);
  assertEquals(
    toSrt(cues),
    "1\n00:00:00,000 --> 00:00:01,400\none two three.\n\n2\n00:00:01,500 --> 00:00:01,900\nfour\n",
  );
});

Deno.test("buildCues keeps phone captions to the word and character limits", () => {
  const w: Word[] = Array.from({ length: 9 }, (_, i) => ({
    start: i * 0.5,
    end: i * 0.5 + 0.4,
    text: `word${i}`,
  }));
  const cues = buildCues(w, [{ start: 0, end: 10 }], {
    maxWords: 4,
    maxChars: 24,
  });
  assertEquals(cues.map((c) => c.text), [
    "word0 word1 word2 word3",
    "word4 word5 word6 word7",
    "word8",
  ]);
  assert(cues.every((c) => c.text.length <= 24));
});

Deno.test("toAss sizes the caption in pixels of the video frame", () => {
  const ass = toAss([{ start: 1.5, end: 62.25, text: "hi {there}" }], {
    width: 1080,
    height: 1920,
    fontSize: 64,
    marginBottom: 420,
    marginSide: 60,
  });
  assertStringIncludes(ass, "PlayResX: 1080\nPlayResY: 1920");
  assertStringIncludes(ass, "Style: Default,DejaVu Sans,64,");
  assertStringIncludes(ass, ",2,60,60,420,1");
  assertStringIncludes(
    ass,
    "Dialogue: 0,0:00:01.50,0:01:02.25,Default,,0,0,0,,hi there",
  );
});

Deno.test("trimConcatGraph trims every kept range and joins them", () => {
  const graph = trimConcatGraph(
    [{ start: 0, end: 2 }, { start: 5, end: 8 }],
    true,
    "crop=1:1",
  );
  assertStringIncludes(
    graph,
    "[0:v]trim=start=5:end=8,setpts=PTS-STARTPTS[v1]",
  );
  assertStringIncludes(
    graph,
    "[0:a]atrim=start=5:end=8,asetpts=PTS-STARTPTS[a1]",
  );
  assertStringIncludes(graph, "[v0][a0][v1][a1]concat=n=2:v=1:a=1[vc][a]");
  assertStringIncludes(graph, "[vc]crop=1:1[v]");
});

Deno.test("buildKdenlive writes the kept ranges as frame entries on a video and an audio track, plus guides", () => {
  const xml = buildKdenlive({
    title: "demo & <co>",
    mediaPath: "/tmp/a b.mp4",
    width: 1920,
    height: 1080,
    fpsNum: 25,
    fpsDen: 1,
    mediaSeconds: 100,
    keeps: [{ start: 0, end: 5 }, { start: 6, end: 20 }, {
      start: 22,
      end: 100,
    }],
    chapters: [{ start: 0, title: `Intro "x"` }, { start: 4.4, title: "Next" }],
  });
  assert(xml.startsWith(`<?xml version="1.0" encoding="utf-8"?>\n<mlt `));
  // Well formed: every opening tag is closed in order.
  const stack: string[] = [];
  for (const m of xml.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    if (m[3] === "/" || m[2] === "xml") continue;
    if (m[1] === "/") assertEquals(stack.pop(), m[2]);
    else stack.push(m[2]);
  }
  assertEquals(stack, []);
  assertStringIncludes(xml, `title="demo &amp; &lt;co&gt;"`);
  assertStringIncludes(
    xml,
    `<property name="resource">/tmp/a b.mp4</property>`,
  );
  assertStringIncludes(xml, `frame_rate_num="25" frame_rate_den="1"`);
  for (const track of ["producer_v", "producer_a"]) {
    const entries = [
      ...xml.matchAll(
        new RegExp(
          `<entry producer="${track}" in="(\\d+)" out="(\\d+)"/>`,
          "g",
        ),
      ),
    ];
    assertEquals(entries.map((e) => [e[1], e[2]]), [["0", "124"], [
      "150",
      "499",
    ], ["550", "2499"]]);
  }
  // Cut length: 125 + 350 + 1950 frames.
  assertStringIncludes(xml, `<tractor id="tractor_main" in="0" out="2424">`);
  const guides = xml.match(/docproperties\.guides">([^<]*)</)![1].replaceAll(
    "&quot;",
    `"`,
  );
  assertEquals(JSON.parse(guides), [
    { comment: `Intro "x"`, pos: 0, type: 0 },
    { comment: "Next", pos: 110, type: 0 },
  ]);
});

Deno.test("editBrief lists numbered segments and the four reasons, and asks for JSON only", () => {
  const brief = editBrief(
    [{ n: 1, start: 0, end: 4.5, text: "Hello there." }, {
      n: 2,
      start: 5,
      end: 9,
      text: "Next.",
    }],
    [{ start: 1, end: 2, reason: "silence" }],
    120,
  );
  assertStringIncludes(brief, "[1] 0.0–4.5 s  Hello there.");
  assertStringIncludes(brief, "[2] 5.0–9.0 s  Next.");
  assertStringIncludes(brief, "`filler`");
  assertStringIncludes(brief, "`retake`");
  assertStringIncludes(brief, "`off-topic`");
  assertStringIncludes(brief, "30–55 s");
  assertStringIncludes(brief, "one JSON object");
});

Deno.test("assertSlug rejects a slug that would leave videos/", () => {
  for (const bad of ["", "../x", "a/b", "a\\b", "..", "x..y"]) {
    assertThrows(() => assertSlug(bad), Error, "must be one plain name");
  }
  assertSlug("my-video-2");
});
