import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import {
  buildNtfySummary,
  fetchGithubStarsSection,
  fetchUmamiStatsSection,
  fetchYoutubeSection,
  formatMarkdownTable,
  formatReport,
  parseRepoList,
  type Section,
  sendNtfy,
} from "./weekly-numbers.ts";

Deno.test("parseRepoList splits, trims and drops empty entries", () => {
  assertEquals(parseRepoList("spy4x/rostok, spy4x/mig ,,spy4x/zond"), [
    "spy4x/rostok",
    "spy4x/mig",
    "spy4x/zond",
  ]);
});

Deno.test("parseRepoList returns an empty list for an unset value", () => {
  assertEquals(parseRepoList(undefined), []);
  assertEquals(parseRepoList(""), []);
});

Deno.test("formatMarkdownTable renders a header, separator and one row per entry", () => {
  const table = formatMarkdownTable(["repo", "stars"], [["rostok", "12"], [
    "mig",
    "3",
  ]]);
  assertEquals(
    table,
    "| repo | stars |\n| --- | --- |\n| rostok | 12 |\n| mig | 3 |",
  );
});

Deno.test("formatMarkdownTable renders just the header for an empty section", () => {
  assertEquals(
    formatMarkdownTable(["metric", "value"], []),
    "| metric | value |\n| --- | --- |",
  );
});

Deno.test("formatReport includes every section's title and a table or its warning", () => {
  const sections: Section[] = [
    {
      title: "GitHub stars",
      headers: ["repo", "stars"],
      rows: [["rostok", "12"]],
    },
    {
      title: "YouTube",
      headers: ["metric", "value"],
      rows: [],
      warning: "YOUTUBE_API_KEY not set — skipped",
    },
  ];
  const report = formatReport(sections);
  assertStringIncludes(report, "## GitHub stars");
  assertStringIncludes(report, "| rostok | 12 |");
  assertStringIncludes(report, "## YouTube");
  assertStringIncludes(report, "YOUTUBE_API_KEY not set — skipped");
});

Deno.test("buildNtfySummary lists a section's warning instead of an empty table", () => {
  const sections: Section[] = [
    {
      title: "Umami — last 7 days",
      headers: [],
      rows: [],
      warning: "UMAMI_API_URL not set — skipped",
    },
  ];
  assertEquals(
    buildNtfySummary(sections),
    "Umami — last 7 days: UMAMI_API_URL not set — skipped",
  );
});

Deno.test("buildNtfySummary caps the rows it includes per section", () => {
  const sections: Section[] = [
    {
      title: "GitHub stars",
      headers: ["repo", "stars"],
      rows: [["a", "1"], ["b", "2"], ["c", "3"], ["d", "4"]],
    },
  ];
  const summary = buildNtfySummary(sections, 2);
  assertEquals(summary, "GitHub stars:\na — 1\nb — 2");
});

// --- fail-open when a data source's env vars are absent ---
// Each of these deletes the relevant env vars (restoring them afterwards so
// no other test in this file sees a changed environment), then asserts the
// section skips WITHOUT calling fetch — proving it never attempts, and
// never throws, rather than attempting and swallowing a real error.

function withEnvCleared<T>(names: string[], fn: () => Promise<T>): Promise<T> {
  const previous = new Map(names.map((n) => [n, Deno.env.get(n)]));
  for (const n of names) Deno.env.delete(n);
  return fn().finally(() => {
    for (const n of names) {
      const v = previous.get(n);
      if (v === undefined) Deno.env.delete(n);
      else Deno.env.set(n, v);
    }
  });
}

async function withFetchSpy<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; calls: number }> {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = ((..._args: Parameters<typeof fetch>) => {
    calls++;
    return Promise.reject(new Error("fetch should not have been called"));
  }) as typeof fetch;
  try {
    const result = await fn();
    return { result, calls };
  } finally {
    globalThis.fetch = original;
  }
}

Deno.test("fetchUmamiStatsSection skips without a network call when env vars are missing", async () => {
  const { result, calls } = await withFetchSpy(() =>
    withEnvCleared(
      ["UMAMI_API_URL", "UMAMI_API_TOKEN", "UMAMI_ID"],
      fetchUmamiStatsSection,
    )
  );
  assertEquals(calls, 0);
  assertStringIncludes(result.warning ?? "", "not set — skipped");
  assertEquals(result.rows, []);
});

Deno.test("fetchGithubStarsSection skips without a network call when GITHUB_REPOS is unset", async () => {
  const { result, calls } = await withFetchSpy(() =>
    withEnvCleared(["GITHUB_REPOS"], fetchGithubStarsSection)
  );
  assertEquals(calls, 0);
  assertStringIncludes(result.warning ?? "", "GITHUB_REPOS not set — skipped");
});

Deno.test("fetchYoutubeSection skips without a network call when its env vars are missing", async () => {
  const { result, calls } = await withFetchSpy(() =>
    withEnvCleared(
      ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"],
      fetchYoutubeSection,
    )
  );
  assertEquals(calls, 0);
  assertStringIncludes(result.warning ?? "", "not set — skipped");
});

Deno.test("sendNtfy skips without a network call when NTFY_URL or NTFY_TOPIC is missing", async () => {
  const { calls } = await withFetchSpy(() =>
    withEnvCleared(["NTFY_URL", "NTFY_TOPIC"], () => sendNtfy("test message"))
  );
  assertEquals(calls, 0);
});
