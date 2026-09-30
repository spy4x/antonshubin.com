import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import {
  buildNtfySummary,
  compareRows,
  EVENT_RENAME_DATE,
  eventRenameNotice,
  fetchGithubStarsSection,
  fetchUmamiBookPlacesSection,
  fetchUmamiCampaignsSection,
  fetchUmamiEventsSection,
  fetchUmamiGoalsSection,
  fetchUmamiPostReadsSection,
  fetchUmamiStatsSection,
  fetchUmamiTopPagesSection,
  fetchYoutubeSection,
  formatConversionRate,
  formatMarkdownTable,
  formatReport,
  parseRepoList,
  type Section,
  sendNtfy,
  statNumber,
  type UmamiSource,
  umamiSource,
  weekWindows,
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

Deno.test("buildNtfySummary sends visitors, conversions and the conversion rate, previous week first", () => {
  const sections: Section[] = [
    { title: "GitHub stars", headers: ["repo", "stars"], rows: [["a", "1"]] },
    {
      title: "Umami — last 7 days",
      headers: ["metric", "this week", "previous week"],
      rows: [
        ["visitors", "40", "30"],
        ["visits", "45", "33"],
        ["pageviews", "90", "70"],
        ["conversions", "2", "1"],
        ["conversion rate", "5.0%", "3.3%"],
      ],
    },
  ];
  assertEquals(
    buildNtfySummary(sections),
    "Previous week → this week\nVisitors: 30 → 40\nConversions: 1 → 2\n" +
      "Conversion rate: 3.3% → 5.0%",
  );
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

// --- Umami requests, against a stubbed fetch ---
// Each of these sets placeholder Umami env vars (restoring the previous
// values afterwards), builds the run's source at a fixed time, answers every
// fetch through `answer` and records the requested URL, so the test sees
// what was asked for and how the answer is rendered. No network call leaves
// the process.

const NOW = Date.UTC(2026, 9, 18, 9);
const DAY = 24 * 60 * 60 * 1000;

async function withUmamiStub<T>(
  answer: (url: URL) => unknown,
  fn: (source: UmamiSource) => Promise<T>,
): Promise<{ result: T; urls: URL[] }> {
  const env: Record<string, string> = {
    UMAMI_API_URL: "https://umami.example.com/umami/",
    UMAMI_API_TOKEN: "placeholder-token",
    UMAMI_ID: "site-id",
  };
  const previous = new Map(
    Object.keys(env).map((n) => [n, Deno.env.get(n)]),
  );
  for (const [n, v] of Object.entries(env)) Deno.env.set(n, v);
  const original = globalThis.fetch;
  const urls: URL[] = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    urls.push(url);
    return Promise.resolve(Response.json(answer(url)));
  }) as typeof fetch;
  try {
    const source = umamiSource(NOW);
    if (!source) {
      throw new Error(
        "umamiSource() returned undefined with every env var set",
      );
    }
    return { result: await fn(source), urls };
  } finally {
    globalThis.fetch = original;
    for (const [n, v] of previous) {
      if (v === undefined) Deno.env.delete(n);
      else Deno.env.set(n, v);
    }
  }
}

const { current: THIS_WEEK } = weekWindows(NOW);

/** True when `url` asks for the window that ends at `NOW`. */
function isThisWeek(url: URL): boolean {
  return url.searchParams.get("endAt") === String(THIS_WEEK.endAt);
}

Deno.test("weekWindows gives the last 7 days and the 7 days before them, without overlap", () => {
  const { current, previous } = weekWindows(NOW);
  assertEquals(current, { startAt: NOW - 7 * DAY, endAt: NOW });
  assertEquals(previous, { startAt: NOW - 14 * DAY, endAt: NOW - 7 * DAY - 1 });
});

Deno.test("eventRenameNotice shows from the rename day until 14 days after it", () => {
  assertStringIncludes(
    eventRenameNotice(EVENT_RENAME_DATE) ?? "",
    "2026-09-30",
  );
  assertStringIncludes(
    eventRenameNotice(EVENT_RENAME_DATE + 14 * DAY - 1) ?? "",
    "not meaningful",
  );
  assertEquals(eventRenameNotice(EVENT_RENAME_DATE + 14 * DAY), undefined);
});

Deno.test("formatReport prints its notes before the first section", () => {
  const report = formatReport([{ title: "T", headers: ["a"], rows: [["1"]] }], [
    "Heads up",
  ]);
  assertEquals(report.startsWith("> Heads up\n\n## T"), true);
});

Deno.test("formatConversionRate shows one decimal, and a dash when there were no visitors", () => {
  assertEquals(formatConversionRate(2, 30), "6.7%");
  assertEquals(formatConversionRate(0, 30), "0.0%");
  assertEquals(formatConversionRate(1, 0), "—");
});

Deno.test("statNumber reads a v3 plain number and a v2 { value } object", () => {
  assertEquals(statNumber(12), 12);
  assertEquals(statNumber({ value: 7, prev: 3 }), 7);
  assertEquals(Number.isNaN(statNumber(undefined)), true);
});

Deno.test("compareRows keeps this week's order and adds labels seen only last week", () => {
  assertEquals(
    compareRows(
      [{ key: "a", count: 5 }, { key: "b", count: 2 }],
      [{ key: "b", count: 4 }, { key: "c", count: 1 }],
    ),
    [["a", "5", "0"], ["b", "2", "4"], ["c", "0", "1"]],
  );
});

Deno.test("fetchUmamiStatsSection shows each figure beside the previous week and the conversion rate", async () => {
  const { result, urls } = await withUmamiStub((url) => {
    if (url.pathname.endsWith("/stats")) {
      return {
        visitors: 40,
        visits: 45,
        pageviews: 90,
        comparison: { visitors: 30, visits: 33, pageviews: 70 },
      };
    }
    return isThisWeek(url)
      ? [{ x: "book", y: 9 }, { x: "brief-sent", y: 1 }, {
        x: "call-booked",
        y: 1,
      }]
      : [{ x: "call-booked", y: 1 }];
  }, fetchUmamiStatsSection);
  assertEquals(result.warning, undefined);
  assertEquals(result.headers, ["metric", "this week", "previous week"]);
  assertEquals(result.rows, [
    ["visitors", "40", "30"],
    ["visits", "45", "33"],
    ["pageviews", "90", "70"],
    ["conversions", "2", "1"],
    ["conversion rate", "5.0%", "3.3%"],
  ]);
  const stats = urls.filter((u) => u.pathname.endsWith("/stats"));
  assertEquals(stats.length, 1);
  assertEquals(stats[0].searchParams.get("startAt"), String(THIS_WEEK.startAt));
});

Deno.test("fetchUmamiGoalsSection lists every goal, a goal with no events at zero", async () => {
  const { result } = await withUmamiStub(
    (url) =>
      isThisWeek(url) ? [{ x: "book", y: 3 }, { x: "nav-book", y: 8 }] : [],
    fetchUmamiGoalsSection,
  );
  assertEquals(result.rows, [
    ["book", "3", "0"],
    ["brief-sent", "0", "0"],
    ["call-booked", "0", "0"],
    ["newsletter-signup", "0", "0"],
    ["post-read", "0", "0"],
  ]);
});

Deno.test("fetchUmamiEventsSection lists every event, not only the top ten", async () => {
  const events = Array.from(
    { length: 12 },
    (_, i) => ({ x: `event-${i}`, y: 12 - i }),
  );
  const { result, urls } = await withUmamiStub(
    (url) => isThisWeek(url) ? events : [{ x: "old-name", y: 4 }],
    fetchUmamiEventsSection,
  );
  assertEquals(result.rows.length, 13);
  assertEquals(result.rows[12], ["old-name", "0", "4"]);
  assertEquals(urls.every((u) => u.searchParams.get("type") === "event"), true);
});

Deno.test("fetchUmamiBookPlacesSection breaks book clicks down by their place property", async () => {
  const { result, urls } = await withUmamiStub(
    (url) =>
      isThisWeek(url)
        ? [{ value: "nav", total: 4 }, { value: "hero", total: 2 }]
        : [{ value: "hero", total: 1 }],
    fetchUmamiBookPlacesSection,
  );
  assertEquals(urls.length, 2);
  for (const u of urls) {
    assertEquals(u.pathname, "/umami/api/websites/site-id/event-data/values");
    assertEquals(u.searchParams.get("eventName"), "book");
    assertEquals(u.searchParams.get("propertyName"), "place");
  }
  assertEquals(result.rows, [["nav", "4", "0"], ["hero", "2", "1"]]);
});

Deno.test("fetchUmamiPostReadsSection ranks posts by post-read, keyed by the item property", async () => {
  const { result, urls } = await withUmamiStub(
    (url) =>
      isThisWeek(url)
        ? [{ value: "mig", total: 5 }, { value: "zond", total: 2 }]
        : [],
    fetchUmamiPostReadsSection,
  );
  assertEquals(urls[0].searchParams.get("eventName"), "post-read");
  assertEquals(urls[0].searchParams.get("propertyName"), "item");
  assertEquals(result.rows, [["mig", "5", "0"], ["zond", "2", "0"]]);
});

Deno.test("fetchUmamiCampaignsSection asks Umami for utmCampaign metrics in both weeks", async () => {
  const { result, urls } = await withUmamiStub(
    (url) =>
      isThisWeek(url)
        ? [{ x: "opus55-vs-sonnet5", y: 42 }, { x: "mig-launch", y: 7 }]
        : [{ x: "mig-launch", y: 9 }],
    fetchUmamiCampaignsSection,
  );
  assertEquals(urls.length, 2);
  for (const u of urls) {
    assertEquals(u.pathname, "/umami/api/websites/site-id/metrics");
    assertEquals(u.searchParams.get("type"), "utmCampaign");
  }
  assertEquals(result.warning, undefined);
  assertEquals(result.rows, [["opus55-vs-sonnet5", "42", "0"], [
    "mig-launch",
    "7",
    "9",
  ]]);
  assertStringIncludes(
    formatReport([result]),
    "## Umami — top campaigns (7 days)\n\n| campaign | this week | previous week |",
  );
});

Deno.test("fetchUmamiTopPagesSection asks for the path metric and keeps the top ten", async () => {
  const pages = Array.from(
    { length: 12 },
    (_, i) => ({ x: `/p${i}`, y: 12 - i }),
  );
  const { result, urls } = await withUmamiStub(
    () => pages,
    fetchUmamiTopPagesSection,
  );
  assertEquals(urls[0].searchParams.get("type"), "path");
  assertEquals(result.rows.length, 10);
  assertEquals(result.rows[0], ["/p0", "12", "12"]);
});

Deno.test("an Umami section that fails reports a warning instead of throwing", async () => {
  const original = globalThis.fetch;
  const env = ["UMAMI_API_URL", "UMAMI_API_TOKEN", "UMAMI_ID"];
  const previous = new Map(env.map((n) => [n, Deno.env.get(n)]));
  for (const n of env) Deno.env.set(n, "https://umami.example.com");
  globalThis.fetch =
    (() => Promise.resolve(new Response("", { status: 500 }))) as typeof fetch;
  try {
    const section = await fetchUmamiGoalsSection(umamiSource(NOW));
    assertStringIncludes(section.warning ?? "", "Umami fetch failed: 500");
    assertEquals(section.rows, []);
  } finally {
    globalThis.fetch = original;
    for (const [n, v] of previous) {
      if (v === undefined) Deno.env.delete(n);
      else Deno.env.set(n, v);
    }
  }
});
