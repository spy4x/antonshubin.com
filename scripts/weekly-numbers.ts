#!/usr/bin/env -S deno run -A
/**
 * Weekly numbers: visitors and top content from Umami, stars per repo from
 * GitHub, subscribers and views from YouTube. Prints one markdown table per
 * source and sends a short summary to NTFY.
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

/** Renders a full report: one markdown heading + table per section, in order. */
export function formatReport(sections: Section[]): string {
  return sections
    .map((s) => {
      const parts = [`## ${s.title}`];
      if (s.warning) parts.push(`_${s.warning}_`);
      if (s.rows.length > 0 || !s.warning) {
        parts.push(formatMarkdownTable(s.headers, s.rows));
      }
      return parts.join("\n\n");
    })
    .join("\n\n");
}

/** Short plain-text summary for the NTFY push: title + first rows of each section. */
export function buildNtfySummary(
  sections: Section[],
  maxRowsPerSection = 3,
): string {
  return sections
    .map((s) => {
      if (s.warning) return `${s.title}: ${s.warning}`;
      if (s.rows.length === 0) return `${s.title}: no data`;
      const lines = s.rows.slice(0, maxRowsPerSection).map((row) =>
        row.join(" — ")
      );
      return `${s.title}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

async function fetchUmamiMetric(
  apiUrl: string,
  token: string,
  siteId: string,
  type: string,
  startAt: number,
  endAt: number,
): Promise<{ x: string; y: number }[]> {
  const url = `${apiUrl.replace(/\/$/, "")}/api/websites/${siteId}/metrics` +
    `?type=${type}&startAt=${startAt}&endAt=${endAt}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

/** Visitors and pageviews for the last 7 days, via Umami's `/stats` endpoint. */
export async function fetchUmamiStatsSection(): Promise<Section> {
  const title = "Umami — last 7 days";
  const headers = ["metric", "value"];
  const apiUrl = Deno.env.get("UMAMI_API_URL");
  const token = Deno.env.get("UMAMI_API_TOKEN");
  const siteId = Deno.env.get("UMAMI_ID");
  if (!apiUrl || !token || !siteId) {
    return {
      title,
      headers,
      rows: [],
      warning: "UMAMI_API_URL, UMAMI_API_TOKEN or UMAMI_ID not set — skipped",
    };
  }
  try {
    const endAt = Date.now();
    const startAt = endAt - 7 * 24 * 60 * 60 * 1000;
    const res = await fetch(
      `${
        apiUrl.replace(/\/$/, "")
      }/api/websites/${siteId}/stats?startAt=${startAt}&endAt=${endAt}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const stats = await res.json();
    return {
      title,
      headers,
      rows: [
        ["visitors", String(stats.visitors?.value ?? "?")],
        ["visits", String(stats.visits?.value ?? "?")],
        ["pageviews", String(stats.pageviews?.value ?? "?")],
      ],
    };
  } catch (err) {
    return {
      title,
      headers,
      rows: [],
      warning: `Umami stats fetch failed: ${(err as Error).message}`,
    };
  }
}

async function umamiMetricSection(
  title: string,
  type: string,
  columnLabel: string,
  countLabel = "count",
): Promise<Section> {
  const headers = [columnLabel, countLabel];
  const apiUrl = Deno.env.get("UMAMI_API_URL");
  const token = Deno.env.get("UMAMI_API_TOKEN");
  const siteId = Deno.env.get("UMAMI_ID");
  if (!apiUrl || !token || !siteId) {
    return {
      title,
      headers,
      rows: [],
      warning: "UMAMI_API_URL, UMAMI_API_TOKEN or UMAMI_ID not set — skipped",
    };
  }
  try {
    const endAt = Date.now();
    const startAt = endAt - 7 * 24 * 60 * 60 * 1000;
    const metrics = await fetchUmamiMetric(
      apiUrl,
      token,
      siteId,
      type,
      startAt,
      endAt,
    );
    const rows = metrics.slice(0, 10).map((m) => [m.x, String(m.y)]);
    return { title, headers, rows };
  } catch (err) {
    return {
      title,
      headers,
      rows: [],
      warning: `Umami ${type} fetch failed: ${(err as Error).message}`,
    };
  }
}

export const fetchUmamiTopPagesSection = () =>
  umamiMetricSection("Umami — top pages (7 days)", "path", "page");

export const fetchUmamiReferrersSection = () =>
  umamiMetricSection("Umami — top referrers (7 days)", "referrer", "referrer");

// This site tags every button/link it wants to track with a `data-umami-event`
// name (see routes/index.tsx, islands/LeadForm.tsx) — every event Umami
// reports for this site IS a CTA or an outbound click, so no further
// filtering is applied here.
export const fetchUmamiCtaEventsSection = () =>
  umamiMetricSection(
    "Umami — CTA / outbound events (7 days)",
    "event",
    "event",
  );

// `utmCampaign` is a metrics type since Umami v3 (the instance pins `:latest`).
// Its count is distinct sessions per campaign, which Umami's UI calls
// visitors, so the column says so.
export const fetchUmamiCampaignsSection = () =>
  umamiMetricSection(
    "Umami — top campaigns (7 days)",
    "utmCampaign",
    "campaign",
    "visitors",
  );

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
  const sections = await Promise.all([
    fetchUmamiStatsSection(),
    fetchUmamiTopPagesSection(),
    fetchUmamiReferrersSection(),
    fetchUmamiCtaEventsSection(),
    fetchUmamiCampaignsSection(),
    fetchGithubStarsSection(),
    fetchYoutubeSection(),
  ]);

  console.log(`\n${formatReport(sections)}\n`);

  for (const s of sections) {
    if (s.warning) console.warn(`  ⚠ ${s.title}: ${s.warning}`);
  }

  await sendNtfy(buildNtfySummary(sections));
}

if (import.meta.main) {
  await main();
}
