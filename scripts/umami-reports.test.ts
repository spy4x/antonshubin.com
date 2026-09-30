import {
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import {
  planReportCalls,
  readConfig,
  type ReportDefinition,
  REPORTS,
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
  const funnelEnds = REPORTS.filter((r) => r.type === "funnel").map((r) => {
    const steps = r.parameters.steps as { value: string }[];
    return steps[steps.length - 1].value;
  });
  assertEquals(funnelEnds, ["call-booked", "brief-sent"]);
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
