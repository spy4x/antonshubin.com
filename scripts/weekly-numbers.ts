#!/usr/bin/env -S deno run -A
/**
 * Weekly numbers: visitors, conversions, goals, every event and the top
 * content from Umami, each beside the previous 7 days; stars per repo from
 * GitHub; subscribers and views from YouTube. Prints one markdown table per
 * source and sends a short summary (visitors, conversions, conversion rate)
 * to NTFY. The event names are the ones in docs/analytics.md (#318).
 *
 * Run from a Woodpecker cron on Sunday (see `.woodpecker.yml`, the
 * `weekly-numbers` step).
 *
 * This is a reporting script, so per the repo's fail-open rule for
 * non-critical external calls it never throws for a data source that is
 * unconfigured or unreachable: each source is independent, prints a warning
 * and an empty section instead, and the run still finishes and still tries
 * to send NTFY. Nothing here needs a value that isn't in `.env.example`.
 */

import {
  ONE_DAY_IN_MILLISECONDS,
  ONE_WEEK_IN_MILLISECONDS,
} from "@spy4x/platform/universal/time-constants";

export interface Section {
  title: string;
  headers: string[];
  rows: string[][];
  warning?: string;
}

/** Splits a comma-separated env value into trimmed, non-empty entries. */
export function parseRepoList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Renders `headers`/`rows` as a GitHub-flavoured markdown table. */
export function formatMarkdownTable(
  headers: string[],
  rows: string[][],
): string {
  const headerLine = `| ${headers.join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  if (rows.length === 0) return [headerLine, sepLine].join("\n");
  const bodyLines = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerLine, sepLine, ...bodyLines].join("\n");
}

/** Renders a full report: the notes first, then one heading + table per section, in order. */
export function formatReport(
  sections: Section[],
  notes: string[] = [],
): string {
  const parts = notes.map((n) => `> ${n}`);
  for (const s of sections) {
    const lines = [`## ${s.title}`];
    if (s.warning) lines.push(`_${s.warning}_`);
    if (s.rows.length > 0 || !s.warning) {
      lines.push(formatMarkdownTable(s.headers, s.rows));
    }
    parts.push(lines.join("\n\n"));
  }
  return parts.join("\n\n");
}

/** The day the site's Umami events were renamed to the set in docs/analytics.md (#318). */
export const EVENT_RENAME_DATE = Date.UTC(2026, 8, 30);
/** How long after the rename the report warns that event comparisons span it. */
export const EVENT_RENAME_NOTICE_DAYS = 14;

/**
 * The line the report carries while its previous week can still hold the old
 * event names, or undefined once both weeks are past the rename.
 */
export function eventRenameNotice(now: number): string | undefined {
  const end = EVENT_RENAME_DATE +
    EVENT_RENAME_NOTICE_DAYS * ONE_DAY_IN_MILLISECONDS;
  if (now >= end) return undefined;
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return `The site's event names changed on ${
    day(EVENT_RENAME_DATE)
  } (#318), so ` +
    `week-over-week event and goal comparisons are not meaningful until ${
      day(end)
    }.`;
}

/**
 * Formats the conversion rate as a percent with one decimal, or "—" when
 * there were no visitors to divide by.
 */
export function formatConversionRate(
  conversions: number,
  visitors: number,
): string {
  if (!(visitors > 0)) return "—";
  return `${(conversions / visitors * 100).toFixed(1)}%`;
}

/** The events that count as a conversion: a brief that was sent, a call that was booked. */
export const CONVERSION_EVENTS = ["brief-sent", "call-booked"];

/** The goals the report counts, in the order docs/analytics.md lists them. */
export const GOAL_EVENTS = [
  "book",
  "brief-sent",
  "call-booked",
  "newsletter-signup",
  "post-read",
];

/** How long one Umami API call may take before it is abandoned. */
export const UMAMI_TIMEOUT_MS = 10_000;

/** Title of the section the NTFY summary is built from. */
export const UMAMI_STATS_TITLE = "Umami — last 7 days";

const UMAMI_UNSET =
  "UMAMI_API_URL, UMAMI_API_TOKEN or UMAMI_ID not set — skipped";

/** A time range in epoch milliseconds, as Umami's `startAt`/`endAt`. */
export interface TimeWindow {
  startAt: number;
  endAt: number;
}

/** The 7 days before `now`, and the 7 days before those. */
export function weekWindows(
  now: number,
): { current: TimeWindow; previous: TimeWindow } {
  const startAt = now - ONE_WEEK_IN_MILLISECONDS;
  return {
    current: { startAt, endAt: now },
    previous: {
      startAt: startAt - ONE_WEEK_IN_MILLISECONDS,
      endAt: startAt - 1,
    },
  };
}

/**
 * One run's view of Umami: its settings, the two windows, and a `get` that
 * sends each distinct request once, so sections that need the same numbers
 * share one call.
 */
export interface UmamiSource {
  windows: { current: TimeWindow; previous: TimeWindow };
  get(path: string, params: Record<string, string | number>): Promise<unknown>;
}

/** Builds the run's Umami source from env, or undefined when a setting is missing. */
export function umamiSource(now = Date.now()): UmamiSource | undefined {
  const apiUrl = Deno.env.get("UMAMI_API_URL");
  const token = Deno.env.get("UMAMI_API_TOKEN");
  const siteId = Deno.env.get("UMAMI_ID");
  if (!apiUrl || !token || !siteId) return undefined;
  const base = `${apiUrl.replace(/\/$/, "")}/api/websites/${siteId}`;
  const cache = new Map<string, Promise<unknown>>();
  return {
    windows: weekWindows(now),
    get(path, params) {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      );
      const url = `${base}${path}?${query}`;
      let pending = cache.get(url);
      if (!pending) {
        pending = fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(UMAMI_TIMEOUT_MS),
        }).then(async (res) => {
          if (!res.ok) {
            await res.body?.cancel();
            throw new Error(`${res.status} ${res.statusText}`);
          }
          return res.json();
        });
        cache.set(url, pending);
      }
      return pending;
    },
  };
}

/** A label and its count, from a metrics or event-data answer. */
export interface Count {
  key: string;
  count: number;
}

async function metricCounts(
  source: UmamiSource,
  type: string,
  window: TimeWindow,
): Promise<Count[]> {
  const rows = await source.get("/metrics", { type, ...window }) as {
    x: string;
    y: number;
  }[];
  return rows.map((r) => ({ key: String(r.x), count: Number(r.y) }));
}

async function propertyCounts(
  source: UmamiSource,
  eventName: string,
  propertyName: string,
  window: TimeWindow,
): Promise<Count[]> {
  const rows = await source.get("/event-data/values", {
    eventName,
    propertyName,
    ...window,
  }) as { value: string; total: number }[];
  return rows.map((r) => ({ key: String(r.value), count: Number(r.total) }));
}

/** Both windows of one kind of count, fetched side by side. */
async function bothWindows(
  source: UmamiSource,
  fetchCounts: (w: TimeWindow) => Promise<Count[]>,
): Promise<{ current: Count[]; previous: Count[] }> {
  const [current, previous] = await Promise.all([
    fetchCounts(source.windows.current),
    fetchCounts(source.windows.previous),
  ]);
  return { current, previous };
}

/**
 * Rows of `[label, this week, previous week]`: this week's labels in its
 * order, then any label seen only in the previous week, capped at `limit`.
 */
export function compareRows(
  current: Count[],
  previous: Count[],
  limit = Infinity,
): string[][] {
  const prev = new Map(previous.map((c) => [c.key, c.count]));
  const seen = new Set(current.map((c) => c.key));
  const rows = current.map((
    c,
  ) => [c.key, String(c.count), String(prev.get(c.key) ?? 0)]);
  for (const p of previous) {
    if (!seen.has(p.key)) rows.push([p.key, "0", String(p.count)]);
  }
  return rows.slice(0, limit);
}

function countOf(counts: Count[], key: string): number {
  return counts.find((c) => c.key === key)?.count ?? 0;
}

function sumOf(counts: Count[], keys: string[]): number {
  return keys.reduce((total, k) => total + countOf(counts, k), 0);
}

/** Reads a `/stats` figure: a plain number in Umami v3, `{ value }` in v2. */
export function statNumber(value: unknown): number {
  if (value && typeof value === "object" && "value" in value) {
    return Number((value as { value: unknown }).value);
  }
  return value === undefined || value === null ? NaN : Number(value);
}

function shown(n: number): string {
  return Number.isFinite(n) ? String(n) : "?";
}

async function umamiSection(
  source: UmamiSource | undefined,
  title: string,
  headers: string[],
  build: (source: UmamiSource) => Promise<string[][]>,
): Promise<Section> {
  if (!source) return { title, headers, rows: [], warning: UMAMI_UNSET };
  try {
    return { title, headers, rows: await build(source) };
  } catch (err) {
    return {
      title,
      headers,
      rows: [],
      warning: `Umami fetch failed: ${(err as Error).message}`,
    };
  }
}

const WEEK_HEADERS = ["this week", "previous week"];

/**
 * Visitors, visits and pageviews from `/stats` (whose `comparison` holds the
 * previous 7 days), plus conversions and the conversion rate from the events.
 */
export function fetchUmamiStatsSection(
  source = umamiSource(),
): Promise<Section> {
  return umamiSection(
    source,
    UMAMI_STATS_TITLE,
    ["metric", ...WEEK_HEADERS],
    async (s) => {
      const [stats, events] = await Promise.all([
        s.get("/stats", { ...s.windows.current }) as Promise<
          Record<string, unknown>
        >,
        bothWindows(s, (w) => metricCounts(s, "event", w)),
      ]);
      const comparison = (stats.comparison ?? {}) as Record<string, unknown>;
      const figure = (name: string): [number, number] => {
        const current = stats[name];
        const previous = comparison[name] ??
          (current && typeof current === "object"
            ? (current as { prev?: unknown }).prev
            : undefined);
        return [statNumber(current), statNumber(previous)];
      };
      const [visitors, prevVisitors] = figure("visitors");
      const conversions = sumOf(events.current, CONVERSION_EVENTS);
      const prevConversions = sumOf(events.previous, CONVERSION_EVENTS);
      return [
        ["visitors", shown(visitors), shown(prevVisitors)],
        ["visits", ...figure("visits").map(shown)],
        ["pageviews", ...figure("pageviews").map(shown)],
        ["conversions", String(conversions), String(prevConversions)],
        [
          "conversion rate",
          formatConversionRate(conversions, visitors),
          formatConversionRate(prevConversions, prevVisitors),
        ],
      ];
    },
  );
}

/** The goal events' counts, every goal listed even at zero. */
export function fetchUmamiGoalsSection(
  source = umamiSource(),
): Promise<Section> {
  return umamiSection(source, "Umami — goals (7 days)", [
    "goal",
    ...WEEK_HEADERS,
  ], async (s) => {
    const events = await bothWindows(s, (w) => metricCounts(s, "event", w));
    return GOAL_EVENTS.map((g) => [
      g,
      String(countOf(events.current, g)),
      String(countOf(events.previous, g)),
    ]);
  });
}

/** Every custom event, not only the top ten. */
export function fetchUmamiEventsSection(
  source = umamiSource(),
): Promise<Section> {
  return umamiSection(
    source,
    "Umami — every event (7 days)",
    ["event", ...WEEK_HEADERS],
    async (s) => {
      const { current, previous } = await bothWindows(
        s,
        (w) => metricCounts(s, "event", w),
      );
      return compareRows(current, previous);
    },
  );
}

/** `book` clicks by their `place` property. */
export function fetchUmamiBookPlacesSection(
  source = umamiSource(),
): Promise<Section> {
  return umamiSection(
    source,
    "Umami — book clicks by place (7 days)",
    ["place", ...WEEK_HEADERS],
    async (s) => {
      const { current, previous } = await bothWindows(
        s,
        (w) => propertyCounts(s, "book", "place", w),
      );
      return compareRows(current, previous);
    },
  );
}

/** Posts ranked by `post-read`, the event sent when a post was read to the end. */
export function fetchUmamiPostReadsSection(
  source = umamiSource(),
): Promise<Section> {
  return umamiSection(
    source,
    "Umami — posts read to the end (7 days)",
    ["post", ...WEEK_HEADERS],
    async (s) => {
      const { current, previous } = await bothWindows(
        s,
        (w) => propertyCounts(s, "post-read", "item", w),
      );
      return compareRows(current, previous);
    },
  );
}

function topMetricSection(
  source: UmamiSource | undefined,
  title: string,
  type: string,
  label: string,
): Promise<Section> {
  return umamiSection(source, title, [label, ...WEEK_HEADERS], async (s) => {
    const { current, previous } = await bothWindows(
      s,
      (w) => metricCounts(s, type, w),
    );
    return compareRows(current, previous, 10);
  });
}

export const fetchUmamiTopPagesSection = (source = umamiSource()) =>
  topMetricSection(source, "Umami — top pages (7 days)", "path", "page");

export const fetchUmamiReferrersSection = (source = umamiSource()) =>
  topMetricSection(
    source,
    "Umami — top referrers (7 days)",
    "referrer",
    "referrer",
  );

// `utmCampaign` is a metrics type since Umami v3 (the instance pins `:latest`).
// Its count is distinct sessions per campaign, which Umami's UI calls
// visitors: the campaign rows count visitors, not events.
export const fetchUmamiCampaignsSection = (source = umamiSource()) =>
  topMetricSection(
    source,
    "Umami — top campaigns (7 days)",
    "utmCampaign",
    "campaign",
  );

/**
 * The NTFY push: visitors, conversions and the conversion rate, each as
 * "previous week → this week", read from the stats section. A skipped or
 * failed Umami section sends its warning instead.
 */
export function buildNtfySummary(sections: Section[]): string {
  const stats = sections.find((s) => s.title === UMAMI_STATS_TITLE);
  if (!stats) return `${UMAMI_STATS_TITLE}: no data`;
  if (stats.warning) return `${stats.title}: ${stats.warning}`;
  const lines = ["Previous week → this week"];
  for (
    const [label, name] of [
      ["Visitors", "visitors"],
      ["Conversions", "conversions"],
      ["Conversion rate", "conversion rate"],
    ]
  ) {
    const row = stats.rows.find((r) => r[0] === name);
    if (row) lines.push(`${label}: ${row[2]} → ${row[1]}`);
  }
  return lines.join("\n");
}

/** Stargazer counts for each `owner/repo` in `GITHUB_REPOS`. */
export async function fetchGithubStarsSection(): Promise<Section> {
  const title = "GitHub stars";
  const headers = ["repo", "stars"];
  const repos = parseRepoList(Deno.env.get("GITHUB_REPOS"));
  if (repos.length === 0) {
    return {
      title,
      headers,
      rows: [],
      warning: "GITHUB_REPOS not set — skipped",
    };
  }
  const rows: string[][] = [];
  for (const repo of repos) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "antonshubin.com-weekly-numbers",
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      rows.push([repo, String(data.stargazers_count ?? "?")]);
    } catch (err) {
      rows.push([repo, `error: ${(err as Error).message}`]);
    }
  }
  return { title, headers, rows };
}

/** Subscriber and view counts for `YOUTUBE_CHANNEL_ID`. */
export async function fetchYoutubeSection(): Promise<Section> {
  const title = "YouTube";
  const headers = ["metric", "value"];
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  const channelId = Deno.env.get("YOUTUBE_CHANNEL_ID");
  if (!apiKey || !channelId) {
    return {
      title,
      headers,
      rows: [],
      warning: "YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not set — skipped",
    };
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels` +
      `?part=statistics&id=${channelId}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const stats = data.items?.[0]?.statistics;
    if (!stats) throw new Error("no channel in response");
    return {
      title,
      headers,
      rows: [
        ["subscribers", String(stats.subscriberCount ?? "?")],
        ["views", String(stats.viewCount ?? "?")],
      ],
    };
  } catch (err) {
    return {
      title,
      headers,
      rows: [],
      warning: `YouTube fetch failed: ${(err as Error).message}`,
    };
  }
}

/** Sends `message` to the configured NTFY topic. Fails open: never throws. */
export async function sendNtfy(message: string): Promise<void> {
  const url = Deno.env.get("NTFY_URL");
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!url || !topic) {
    console.warn("  ⚠ NTFY_URL or NTFY_TOPIC not set — skipped the push");
    return;
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/${topic}`, {
      method: "POST",
      headers: { Title: "Weekly numbers" },
      body: message,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    console.log("  ✓ NTFY push sent");
  } catch (err) {
    console.warn(`  ⚠ NTFY push failed: ${(err as Error).message}`);
  }
}

async function main() {
  const now = Date.now();
  const umami = umamiSource(now);
  const sections = await Promise.all([
    fetchUmamiStatsSection(umami),
    fetchUmamiGoalsSection(umami),
    fetchUmamiEventsSection(umami),
    fetchUmamiBookPlacesSection(umami),
    fetchUmamiPostReadsSection(umami),
    fetchUmamiTopPagesSection(umami),
    fetchUmamiReferrersSection(umami),
    fetchUmamiCampaignsSection(umami),
    fetchGithubStarsSection(),
    fetchYoutubeSection(),
  ]);
  const notice = eventRenameNotice(now);

  console.log(`\n${formatReport(sections, notice ? [notice] : [])}\n`);

  for (const s of sections) {
    if (s.warning) console.warn(`  ⚠ ${s.title}: ${s.warning}`);
  }

  await sendNtfy(buildNtfySummary(sections));
}

if (import.meta.main) {
  await main();
}
