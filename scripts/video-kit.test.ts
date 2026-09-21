import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import { BASE_URL } from "@/lib/config.ts";
import {
  buildContext,
  chaptersDraft,
  deriveCampaign,
  detectTranscriptFormat,
  extractTitleOptions,
  formatTimestamp,
  parseSrt,
  runVideoKit,
} from "./video-kit.ts";

const SRT_SAMPLE = `1
00:00:00,000 --> 00:00:04,000
Welcome back to the channel, today we are shipping something new.

2
00:00:05,500 --> 00:00:09,000
This video walks through the whole packaging pipeline end to end.

3
00:00:40,000 --> 00:00:45,000
Around the halfway mark we cover the trickiest part of the setup.

4
00:01:10,000 --> 00:01:15,000
Here is the second chapter, where we get into the real build.

5
00:02:20,000 --> 00:02:25,000
And now a third chapter, wrapping up with a short recap.
`;

const PLAIN_SAMPLE =
  "Welcome back to the channel, today we are shipping something new. " +
  "This video walks through the whole packaging pipeline end to end. " +
  "Thanks for watching, see you in the next one.";

Deno.test("detectTranscriptFormat accepts .srt and .txt", () => {
  assertEquals(detectTranscriptFormat("transcript.srt"), "srt");
  assertEquals(detectTranscriptFormat("transcript.txt"), "plain");
});

Deno.test("detectTranscriptFormat fails loudly on an unsupported extension, naming the file", () => {
  assertThrows(
    () => detectTranscriptFormat("transcript.vtt"),
    Error,
    'transcript.vtt". Expected a ".txt"',
  );
});

Deno.test("parseSrt turns cues into timestamped segments", () => {
  const segments = parseSrt(SRT_SAMPLE);
  assertEquals(segments.length, 5);
  assertEquals(segments[0].startSeconds, 0);
  assertEquals(segments[2].startSeconds, 40);
  assertEquals(segments[3].startSeconds, 70);
  assertEquals(
    segments[3].text,
    "Here is the second chapter, where we get into the real build.",
  );
});

Deno.test("parseSrt fails loudly when there are no timestamped cues", () => {
  assertThrows(
    () => parseSrt("just some text\nwith no cues at all\n"),
    Error,
    "No timestamped cues",
  );
});

Deno.test("formatTimestamp matches YouTube's chapter format", () => {
  assertEquals(formatTimestamp(0), "0:00");
  assertEquals(formatTimestamp(134), "2:14");
  assertEquals(formatTimestamp(3734), "1:02:14");
});

Deno.test("buildContext turns a timestamped transcript into real chapters past Intro", () => {
  const segments = parseSrt(SRT_SAMPLE);
  const fullText = segments.map((s) => s.text).join(" ");
  const ctx = buildContext("some-post", "some-post-yt", fullText, segments);
  assertEquals(ctx.chapters, [
    { startSeconds: 0, label: "Intro" },
    {
      startSeconds: 70,
      label: "Here is the second chapter, where",
    },
    {
      startSeconds: 140,
      label: "And now a third chapter, wrapping",
    },
  ]);
});

Deno.test("buildContext falls back to a single Intro chapter for a plain transcript with no timestamps", () => {
  const ctx = buildContext("some-post", "some-post-yt", PLAIN_SAMPLE, []);
  assertEquals(ctx.chapters, [{ startSeconds: 0, label: "Intro" }]);
});

Deno.test("chaptersDraft stops producing more than Intro when the transcript has no timestamped segments", () => {
  const ctx = buildContext("some-post", "some-post-yt", PLAIN_SAMPLE, []);
  assertEquals(chaptersDraft(ctx), "0:00 Intro\n");
});

Deno.test("extractTitleOptions returns several candidates, not one", () => {
  const options = extractTitleOptions(PLAIN_SAMPLE);
  assertEquals(options.length > 1, true);
});

Deno.test("extractTitleOptions fails loudly when nothing is title-length", () => {
  assertThrows(
    () => extractTitleOptions("Hi."),
    Error,
    "no sentence between 15 and 90 characters",
  );
});

Deno.test("deriveCampaign follows the <topic>-yt pattern from docs/utm.md by default", () => {
  assertEquals(
    deriveCampaign("building-mcp-servers-with-deno"),
    "building-mcp-servers-with-deno-yt",
  );
});

Deno.test("deriveCampaign uses the explicit override when given one", () => {
  assertEquals(
    deriveCampaign("some-post", "custom-campaign"),
    "custom-campaign",
  );
});

Deno.test("buildContext's tagged blog link carries exactly the three UTM params from docs/utm.md", () => {
  const ctx = buildContext("some-post", "some-post-yt", PLAIN_SAMPLE, []);
  const url = new URL(ctx.taggedBlogUrl);
  const params = url.searchParams;
  assertEquals(params.get("utm_source"), "youtube");
  assertEquals(params.get("utm_medium"), "blog");
  assertEquals(params.get("utm_campaign"), "some-post-yt");
  assertEquals([...params.keys()].length, 3);
});

Deno.test("buildContext's tagged blog link path never ends in a trailing slash", () => {
  const ctx = buildContext("some-post", "some-post-yt", PLAIN_SAMPLE, []);
  const url = new URL(ctx.taggedBlogUrl);
  assertEquals(url.pathname, "/blog/some-post");
  assertEquals(url.origin, new URL(BASE_URL).origin);
});

Deno.test("runVideoKit fails loudly, naming the file, when the transcript is missing", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        runVideoKit({
          transcriptPath: `${tempDir}/does-not-exist.txt`,
          slug: "some-post",
          outDir: `${tempDir}/out`,
        }),
      Error,
      "Transcript file not found",
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("runVideoKit fails loudly on an unsupported transcript instead of writing empty drafts", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const transcriptPath = `${tempDir}/transcript.vtt`;
    await Deno.writeTextFile(transcriptPath, "WEBVTT\n\nsome text\n");
    const outDir = `${tempDir}/out`;
    await assertRejects(
      () => runVideoKit({ transcriptPath, slug: "some-post", outDir }),
      Error,
      "Unsupported transcript format",
    );
    let outDirExists = true;
    try {
      await Deno.stat(outDir);
    } catch {
      outDirExists = false;
    }
    assertEquals(outDirExists, false);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("runVideoKit writes titles, description, chapters and a blog draft from a plain transcript", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const transcriptPath = `${tempDir}/transcript.txt`;
    await Deno.writeTextFile(transcriptPath, PLAIN_SAMPLE);
    const outDir = `${tempDir}/out`;
    const result = await runVideoKit({
      transcriptPath,
      slug: "some-post",
      outDir,
    });
    assertEquals(result.outDir, outDir);
    assertEquals(result.files.length, 4);

    const titles = await Deno.readTextFile(`${outDir}/titles.md`);
    const numberedOptions = titles.match(/^\d+\.\s/gm) ?? [];
    assertEquals(
      numberedOptions.length > 1,
      true,
      "titles.md must list more than one numbered option",
    );

    const description = await Deno.readTextFile(`${outDir}/description.md`);
    const linkUrl =
      "https://antonshubin.com/blog/some-post?utm_source=youtube&utm_medium=blog&utm_campaign=some-post-yt";
    const summaryFirstWords = "Welcome back to the channel";
    const summaryIndex = description.indexOf(summaryFirstWords);
    const linkIndex = description.indexOf(linkUrl);
    assertEquals(
      summaryIndex !== -1,
      true,
      "description.md must carry the summary text",
    );
    assertEquals(
      linkIndex !== -1,
      true,
      "description.md must carry the tagged link",
    );
    assertEquals(
      summaryIndex < linkIndex,
      true,
      "description.md must show the summary above the link",
    );

    const chapters = await Deno.readTextFile(`${outDir}/chapters.md`);
    assertEquals(chapters, "0:00 Intro\n");

    const blogDraft = await Deno.readTextFile(`${outDir}/blog-draft.md`);
    assertEquals(blogDraft.startsWith("---\ntitle:"), true);
    assertEquals(blogDraft.includes("description:"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("runVideoKit builds real chapters from a timestamped .srt transcript", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const transcriptPath = `${tempDir}/transcript.srt`;
    await Deno.writeTextFile(transcriptPath, SRT_SAMPLE);
    const outDir = `${tempDir}/out`;
    await runVideoKit({ transcriptPath, slug: "some-post", outDir });

    const chapters = await Deno.readTextFile(`${outDir}/chapters.md`);
    const lines = chapters.trim().split("\n");
    assertEquals(lines.length, 3);
    assertEquals(lines[0], "0:00 Intro");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("runVideoKit honors an explicit campaign override", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const transcriptPath = `${tempDir}/transcript.txt`;
    await Deno.writeTextFile(transcriptPath, PLAIN_SAMPLE);
    const outDir = `${tempDir}/out`;
    await runVideoKit({
      transcriptPath,
      slug: "some-post",
      campaign: "custom-campaign",
      outDir,
    });
    const description = await Deno.readTextFile(`${outDir}/description.md`);
    assertEquals(description.includes("utm_campaign=custom-campaign"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
