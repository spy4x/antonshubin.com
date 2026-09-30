import {
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import {
  MANAGED,
  planReportCalls,
  readConfig,
  type ReportDefinition,
  REPORTS,
  RETIRED_REPORTS,
  type SavedReport,
  syncReports,
  type UmamiConfig,
} from "./umami-reports.ts";

const config: UmamiConfig = {
  apiUrl: "https://umami.example.com",
  token: "placeholder-token",
  websiteId: "site-id",
};

const goalBook: ReportDefinition = {
  name: "Goal: book",
  type: "goal",
  description: "Book clicks.",
  parameters: { type: "event", value: "book" },
};

interface Recorded {
  method: string;
  url: URL;
  body?: Record<string, unknown>;
  auth: string | null;
  signal: AbortSignal | null | undefined;
}

/** A stub `fetch` that answers the list call with `saved` and every write with `{}`. */
function stubFetch(
  saved: SavedReport[],
): { fetchFn: typeof fetch; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fetchFn = ((input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    calls.push({
      method,
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      auth: new Headers(init?.headers).get("Authorization"),
      signal: init?.signal,
    });
    if (method === "GET") {
      return Promise.resolve(
        Response.json({ data: saved, count: saved.length, page: 1 }),
      );
    }
    return Promise.resolve(Response.json({}));
  }) as typeof fetch;
  return { fetchFn, calls };
}

Deno.test("readConfig throws naming every missing Umami variable", () => {
  const err = assertThrows(() => readConfig(() => undefined), Error);
  assertStringIncludes(err.message, "UMAMI_API_URL, UMAMI_API_TOKEN, UMAMI_ID");
});

Deno.test("readConfig trims a trailing slash from the API URL", () => {
  const env: Record<string, string> = {
    UMAMI_API_URL: "https://umami.example.com/",
    UMAMI_API_TOKEN: "t",
    UMAMI_ID: "site-id",
  };
  assertEquals(readConfig((n) => env[n]).apiUrl, "https://umami.example.com");
});

Deno.test("planReportCalls creates a report that has no saved namesake", () => {
  const [call] = planReportCalls([], [goalBook], "site-id");
  assertEquals(call.action, "create");
  assertEquals(call.path, "/api/reports");
  assertEquals(call.body, {
    websiteId: "site-id",
    type: "goal",
    name: "Goal: book",
    description: "Book clicks.",
    parameters: { type: "event", value: "book" },
  });
});

Deno.test("planReportCalls updates the saved report with the same name when its settings differ", () => {
  const saved: SavedReport[] = [{
    id: "r1",
    name: "Goal: book",
    type: "goal",
    description: "Book clicks.",
    parameters: { type: "event", value: "nav-book" },
  }];
  const [call] = planReportCalls(saved, [goalBook], "site-id");
  assertEquals(call.action, "update");
  assertEquals(call.path, "/api/reports/r1");
  assertEquals(call.body?.parameters, { type: "event", value: "book" });
});

Deno.test("planReportCalls leaves a matching report unchanged, whatever its key order", () => {
  const saved: SavedReport[] = [{
    id: "r1",
    name: "Goal: book",
    type: "goal",
    description: "Book clicks.",
    parameters: { value: "book", type: "event" },
  }];
  assertEquals(
    planReportCalls(saved, [goalBook], "site-id")[0].action,
    "unchanged",
  );
});

Deno.test("syncReports sends one create per missing report and never touches reports it does not name", async () => {
  const foreign: SavedReport = {
    id: "mine",
    name: "Anton's own funnel",
    type: "funnel",
    description: "",
    parameters: {},
  };
  const { fetchFn, calls } = stubFetch([foreign]);
  const result = await syncReports(config, { fetchFn });
  assertEquals(result.success, true);
  const writes = calls.filter((c) => c.method !== "GET");
  assertEquals(writes.length, REPORTS.length);
  for (const w of writes) {
    assertEquals(w.method, "POST");
    assertEquals(w.url.pathname, "/api/reports");
  }
  assertEquals(calls.some((c) => c.url.pathname.includes("mine")), false);
  assertEquals(calls.every((c) => c.auth === "Bearer placeholder-token"), true);
});

Deno.test("syncReports sends nothing when every report already matches", async () => {
  const saved = REPORTS.map((r, i) => ({ id: `r${i}`, ...r }));
  const { fetchFn, calls } = stubFetch(saved);
  const result = await syncReports(config, { fetchFn });
  assertEquals(result.success, true);
  assertEquals(calls.filter((c) => c.method !== "GET").length, 0);
});

Deno.test("syncReports under dry-run lists the saved reports but sends no write", async () => {
  const { fetchFn, calls } = stubFetch([]);
  const result = await syncReports(config, { fetchFn, dryRun: true });
  assertEquals(result.success, true);
  assertEquals(calls.map((c) => c.method), ["GET"]);
  assertEquals(calls[0].url.pathname, "/api/reports");
  assertEquals(calls[0].url.searchParams.get("websiteId"), "site-id");
  assertEquals(
    result.output.filter((l) => l.startsWith("[dry-run] create")).length,
    REPORTS.length,
  );
  assertEquals(result.output.join("\n").includes("placeholder-token"), false);
});

Deno.test("syncReports reports a failed call as an unsuccessful result instead of throwing", async () => {
  const fetchFn =
    (() =>
      Promise.resolve(new Response("no", { status: 401 }))) as typeof fetch;
  const result = await syncReports(config, { fetchFn });
  assertEquals(result.success, false);
  assertStringIncludes(result.error ?? "", "401");
});

Deno.test("REPORTS holds the five goals and a funnel for each outcome, with unique names", () => {
  const names = REPORTS.map((r) => r.name);
  assertEquals(new Set(names).size, names.length);
  const goals = REPORTS.filter((r) => r.type === "goal").map((r) =>
    r.parameters.value
  );
  assertEquals(goals, [
    "book",
    "brief-sent",
    "call-booked",
    "newsletter-signup",
    "post-read",
  ]);
  const funnels = REPORTS.filter((r) => r.type === "funnel").map((r) =>
    (r.parameters.steps as { value: string }[]).map((s) => s.value)
  );
  assertEquals(funnels, [
    ["/*", "/book", "call-booked"],
    ["/book", "call-booked"],
    ["/*", "brief-sent"],
  ]);
});

Deno.test("syncReports follows Umami's paging, so a report on page two is matched instead of created again", async () => {
  const pages: SavedReport[][] = [
    [{
      id: "other",
      name: "Other",
      type: "goal",
      description: "",
      parameters: {},
    }],
    REPORTS.map((r, i) => ({ id: `r${i}`, ...r })),
  ];
  const calls: string[] = [];
  const fetchFn = ((input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(`${init?.method ?? "GET"} ${url.pathname}`);
    const page = Number(url.searchParams.get("page"));
    return Promise.resolve(
      Response.json({
        data: pages[page - 1] ?? [],
        count: 1 + REPORTS.length,
        page,
      }),
    );
  }) as typeof fetch;
  const result = await syncReports(config, { fetchFn });
  assertEquals(result.success, true);
  assertEquals(calls, ["GET /api/reports", "GET /api/reports"]);
});

for (
  const [field, changed] of [
    ["description", { description: "An older wording." }],
    ["type", { type: "funnel" }],
  ] as const
) {
  Deno.test(`planReportCalls updates a same-name report whose ${field} differs`, () => {
    const saved: SavedReport[] = [{ id: "r1", ...goalBook, ...changed }];
    const [call] = planReportCalls(saved, [goalBook], "site-id");
    assertEquals(call.action, "update");
    assertEquals(call.body?.[field], goalBook[field]);
  });
}

Deno.test("syncReports gives every Umami call a 10-second timeout, so a stalled server cannot hang it", async () => {
  const { fetchFn, calls } = stubFetch([]);
  const timeout = AbortSignal.timeout;
  const timeouts: number[] = [];
  AbortSignal.timeout = (ms: number) => (timeouts.push(ms), timeout(ms));
  try {
    await syncReports(config, { fetchFn });
  } finally {
    AbortSignal.timeout = timeout;
  }
  assertEquals(calls.length, 1 + REPORTS.length);
  assertEquals(timeouts, calls.map(() => 10_000));
  for (const c of calls) assertEquals(c.signal instanceof AbortSignal, true);
});

Deno.test("syncReports deletes each retired /contact-me funnel it once created, and nothing else", async () => {
  const current = REPORTS.map((r, i) => ({ id: `r${i}`, ...r }));
  const retired = RETIRED_REPORTS.map((name, i) => ({
    id: `old${i}`,
    name,
    type: "funnel",
    description: `Retired. ${MANAGED}`,
    parameters: {},
  }));
  const { fetchFn, calls } = stubFetch([...current, ...retired]);
  const result = await syncReports(config, { fetchFn });
  assertEquals(result.success, true);
  const writes = calls.filter((c) => c.method !== "GET");
  assertEquals(
    writes.map((c) => `${c.method} ${c.url.pathname}`),
    ["DELETE /api/reports/old0", "DELETE /api/reports/old1"],
  );
  assertEquals(RETIRED_REPORTS.every((n) => n.includes("/contact-me")), true);
});

Deno.test("a report with a retired name but no managed marker is never deleted", () => {
  const byHand: SavedReport = {
    id: "hand",
    name: RETIRED_REPORTS[0],
    type: "funnel",
    description: "Made in the Umami UI.",
    parameters: {},
  };
  const calls = planReportCalls([byHand], [], "site-id");
  assertEquals(calls, []);
});

Deno.test("syncReports under dry-run plans the retired deletions but sends none", async () => {
  const retired: SavedReport = {
    id: "old0",
    name: RETIRED_REPORTS[0],
    type: "funnel",
    description: MANAGED,
    parameters: {},
  };
  const { fetchFn, calls } = stubFetch([retired]);
  const result = await syncReports(config, { fetchFn, dryRun: true });
  assertEquals(calls.map((c) => c.method), ["GET"]);
  assertEquals(
    result.output.filter((l) => l.startsWith("[dry-run] delete")).length,
    1,
  );
});
