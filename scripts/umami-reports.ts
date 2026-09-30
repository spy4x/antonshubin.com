#!/usr/bin/env -S deno run -A
/**
 * Umami reports as code (#318): the Goals and Funnels this site's analytics
 * rely on, created or updated through Umami's reports API so they can be
 * rebuilt from the repository instead of clicked together in the UI.
 *
 * Idempotent: it lists the website's saved reports, matches each definition
 * below by name, updates a match whose settings differ, creates a missing one
 * and leaves every other report alone. It never deletes a report.
 *
 * `--dry-run` still lists the saved reports (a read), then prints the create
 * and update calls it would send instead of sending them.
 *
 * API shape (umami-software/umami v3.4.0, commit ec0ff50, and v3.3.1):
 * `GET /api/reports?websiteId=&page=&pageSize=` lists, `POST /api/reports`
 * creates and `POST /api/reports/<id>` updates, each body checked by
 * `reportSchema` in `src/lib/schema.ts` (`websiteId`, `type`, `name`,
 * `description`, `parameters`). A saved goal's parameters are `{ type, value }`
 * and a saved funnel's `{ window, steps }` (`goalParametersSchema` and
 * `funnelParametersSchema` in `src/lib/analytics-schema.ts`). See
 * docs/analytics.md.
 */

/** How long one Umami API call may take before it is abandoned. */
export const UMAMI_TIMEOUT_MS = 10_000;

/** The report types this script manages. */
export type ManagedReportType = "goal" | "funnel";

/** One saved report, as this script wants it to exist in Umami. */
export interface ReportDefinition {
  name: string;
  type: ManagedReportType;
  description: string;
  parameters: Record<string, unknown>;
}

/** A saved report as `GET /api/reports` returns it (only the fields used here). */
export interface SavedReport {
  id: string;
  name: string;
  type: string;
  description: string;
  parameters: unknown;
}

/** Where and as whom the script talks to Umami. */
export interface UmamiConfig {
  apiUrl: string;
  token: string;
  websiteId: string;
}

/** One API call the script sends, or would send under `--dry-run`. */
export interface PlannedCall {
  action: "create" | "update" | "unchanged";
  name: string;
  method: "POST" | "NONE";
  path: string;
  body?: Record<string, unknown>;
}

/** The structured result of a run. */
export interface RunResult {
  success: boolean;
  output: string[];
  error?: string;
}

const MANAGED = "Managed by scripts/umami-reports.ts in spy4x/antonshubin.com.";

/** Minutes a visitor has to complete a funnel, from its first step. */
export const FUNNEL_WINDOW_MINUTES = 60;

function goal(event: string, question: string): ReportDefinition {
  return {
    name: `Goal: ${event}`,
    type: "goal",
    description: `${question} ${MANAGED}`,
    parameters: { type: "event", value: event },
  };
}

/**
 * Every report the script manages, by name. The event names are the ones in
 * docs/analytics.md. A path step ending in `*` matches by prefix, so `/*` is
 * any page (`getFunnel.ts` turns a leading or trailing `*` into `%`). The
 * booking funnel starts at `/contact-me` rather than at `/*`: a visitor who
 * lands on `/contact-me` would match `/*` with that same view and then need a
 * second `/contact-me` view to reach step two.
 */
export const REPORTS: ReportDefinition[] = [
  goal("book", "How many Book clicks, across every place they sit?"),
  goal("brief-sent", "How many written briefs actually reached Anton?"),
  goal("call-booked", "How many intro calls were actually booked?"),
  goal("newsletter-signup", "How many newsletter signups succeeded?"),
  goal("post-read", "How many post views reached the end of the post?"),
  {
    name: "Funnel: /contact-me → call-booked",
    type: "funnel",
    description:
      `Of the visitors who open the booking page, how many book a call? ${MANAGED}`,
    parameters: {
      window: FUNNEL_WINDOW_MINUTES,
      steps: [
        { type: "path", value: "/contact-me" },
        { type: "event", value: "call-booked" },
      ],
    },
  },
  {
    name: "Funnel: any page → brief-sent",
    type: "funnel",
    description: `How many visitors send a written brief? ${MANAGED}`,
    parameters: {
      window: FUNNEL_WINDOW_MINUTES,
      steps: [
        { type: "path", value: "/*" },
        { type: "event", value: "brief-sent" },
      ],
    },
  },
];

/** Reads the three Umami settings; throws naming every one that is missing. */
export function readConfig(
  get: (name: string) => string | undefined = (n) => Deno.env.get(n),
): UmamiConfig {
  const names = ["UMAMI_API_URL", "UMAMI_API_TOKEN", "UMAMI_ID"] as const;
  const missing = names.filter((n) => !get(n));
  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
  return {
    apiUrl: get("UMAMI_API_URL")!.replace(/\/$/, ""),
    token: get("UMAMI_API_TOKEN")!,
    websiteId: get("UMAMI_ID")!,
  };
}

/** Serializes a value with object keys sorted, so key order never counts as a change. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${
      entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")
    }}`;
  }
  return JSON.stringify(value);
}

function parseParameters(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Decides, for each definition, whether to create it, update the saved report
 * with the same name, or leave that report as it is. Reports whose name is
 * not in `definitions` are never touched.
 */
export function planReportCalls(
  saved: SavedReport[],
  definitions: ReportDefinition[],
  websiteId: string,
): PlannedCall[] {
  return definitions.map((def) => {
    const body = {
      websiteId,
      type: def.type,
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    };
    const match = saved.find((r) => r.name === def.name);
    if (!match) {
      return {
        action: "create",
        name: def.name,
        method: "POST",
        path: "/api/reports",
        body,
      };
    }
    const same = match.type === def.type &&
      match.description === def.description &&
      stableJson(parseParameters(match.parameters)) ===
        stableJson(def.parameters);
    if (same) {
      return {
        action: "unchanged",
        name: def.name,
        method: "NONE",
        path: `/api/reports/${match.id}`,
      };
    }
    return {
      action: "update",
      name: def.name,
      method: "POST",
      path: `/api/reports/${match.id}`,
      body,
    };
  });
}

async function umamiFetch(
  config: UmamiConfig,
  fetchFn: typeof fetch,
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetchFn(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(UMAMI_TIMEOUT_MS),
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(
      `${
        init.method ?? "GET"
      } ${path} answered ${res.status} ${res.statusText}`,
    );
  }
  return await res.json();
}

/** Page size for listing saved reports. */
export const LIST_PAGE_SIZE = 100;
/** A safety cap on listing pages, so a server that never ends a list can't loop forever. */
export const MAX_LIST_PAGES = 20;

/** Lists every saved report of the website, following Umami's paging. */
export async function listReports(
  config: UmamiConfig,
  fetchFn: typeof fetch = fetch,
): Promise<SavedReport[]> {
  const all: SavedReport[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const query = new URLSearchParams({
      websiteId: config.websiteId,
      page: String(page),
      pageSize: String(LIST_PAGE_SIZE),
    });
    const res = await umamiFetch(config, fetchFn, `/api/reports?${query}`) as {
      data?: SavedReport[];
      count?: number;
    };
    const data = res.data ?? [];
    all.push(...data);
    if (data.length === 0 || all.length >= Number(res.count ?? 0)) return all;
  }
  throw new Error(`Umami listed more than ${MAX_LIST_PAGES} pages of reports`);
}

/** One line describing a planned call, with no token in it. */
export function describeCall(call: PlannedCall): string {
  if (call.action === "unchanged") return `unchanged  ${call.name}`;
  return `${call.action.padEnd(9)}  ${call.method} ${call.path}  ${
    JSON.stringify(call.body)
  }`;
}

/**
 * Lists the saved reports, plans the calls and, unless `dryRun`, sends them.
 * Never throws: a failed call ends the run with `success: false` and the
 * calls already sent stay applied (running again finishes the rest).
 */
export async function syncReports(
  config: UmamiConfig,
  options: {
    dryRun?: boolean;
    fetchFn?: typeof fetch;
    definitions?: ReportDefinition[];
  } = {},
): Promise<RunResult> {
  const { dryRun = false, fetchFn = fetch, definitions = REPORTS } = options;
  const output: string[] = [];
  try {
    const saved = await listReports(config, fetchFn);
    output.push(`Umami has ${saved.length} saved report(s) for this website.`);
    const calls = planReportCalls(saved, definitions, config.websiteId);
    for (const call of calls) {
      if (call.action === "unchanged" || dryRun) {
        output.push(
          `${dryRun && call.action !== "unchanged" ? "[dry-run] " : ""}${
            describeCall(call)
          }`,
        );
        continue;
      }
      await umamiFetch(config, fetchFn, call.path, {
        method: "POST",
        body: JSON.stringify(call.body),
      });
      output.push(describeCall(call));
    }
    return { success: true, output };
  } catch (err) {
    return { success: false, output, error: (err as Error).message };
  }
}

if (import.meta.main) {
  const dryRun = Deno.args.includes("--dry-run");
  const result = await syncReports(readConfig(), { dryRun });
  for (const line of result.output) console.log(line);
  if (!result.success) {
    console.error(`Failed: ${result.error}`);
    Deno.exit(1);
  }
}
