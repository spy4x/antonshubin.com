import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  checkedLabel,
  committedToolsLive,
  createToolsLive,
  REFRESH_TTL_MS,
  type ToolsLiveRefresher,
  withLiveVersion,
} from "./tools-live.ts";
import { tool, tools } from "./tools.ts";

/** The answer after the refresh started by a first request has finished. */
async function afterRefresh(r: ToolsLiveRefresher) {
  await r.get();
  await r.settled();
  return await r.get();
}

/** A fetch that answers GitHub, Woodpecker and JSR from memory and counts its calls. */
function stubFetch(
  opts: { fail?: (url: string) => boolean; stars?: number; latest?: string } =
    {},
) {
  const calls: string[] = [];
  const signals: (AbortSignal | null | undefined)[] = [];
  const fetcher = ((input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    signals.push(init?.signal);
    if (opts.fail?.(url)) {
      return Promise.resolve(new Response("no", { status: 500 }));
    }
    if (url.startsWith("https://api.github.com/repos/")) {
      return Promise.resolve(Response.json({
        stargazers_count: opts.stars ?? 99,
        license: { spdx_id: "MIT" },
        pushed_at: "2026-09-30T10:00:00Z",
        default_branch: "main",
      }));
    }
    if (url.includes("/pipelines")) {
      return Promise.resolve(Response.json([{
        number: 777,
        status: "failure",
        event: "push",
        branch: "main",
        started: 1_790_000_000,
        finished: 1_790_000_100,
      }]));
    }
    if (url.startsWith("https://jsr.io/")) {
      return Promise.resolve(Response.json({ latest: opts.latest ?? "9.9.9" }));
    }
    return Promise.resolve(new Response("?", { status: 404 }));
  }) as typeof fetch;
  return { fetcher, calls, signals };
}

Deno.test("a disabled refresh answers from the committed file and calls nothing", async () => {
  const { fetcher, calls } = stubFetch();
  const live = await afterRefresh(
    createToolsLive({ enabled: false, fetch: fetcher }),
  );
  assertEquals(live.source, "committed");
  assertEquals(live.checkedAt, null);
  assertEquals(calls.length, 0);
});

Deno.test("an enabled refresh shows the fetched stars, CI status and version", async () => {
  const { fetcher } = stubFetch({ stars: 42, latest: "2.0.0" });
  const live = await afterRefresh(createToolsLive({
    enabled: true,
    fetch: fetcher,
    now: () => Date.parse("2026-09-30T12:00:00Z"),
  }));
  assertEquals(live.source, "live");
  assertEquals(live.checkedAt, "2026-09-30T12:00:00.000Z");
  assertEquals(live.snapshot.repos["spy4x/mig"].stars, 42);
  assertEquals(live.snapshot.repos["spy4x/mig"].ci?.status, "failure");
  assertEquals(live.versions["ts-libs"], "2.0.0");
});

Deno.test("the refresh answers from memory for an hour and fetches again after it", async () => {
  const { fetcher, calls } = stubFetch();
  let t = Date.parse("2026-09-30T12:00:00Z");
  const refresher = createToolsLive({
    enabled: true,
    fetch: fetcher,
    now: () => t,
  });
  await afterRefresh(refresher);
  const first = calls.length;
  assert(first > 0);
  t += REFRESH_TTL_MS - 1;
  await afterRefresh(refresher);
  assertEquals(calls.length, first, "fetched again inside the hour");
  t += 2;
  await afterRefresh(refresher);
  assertEquals(calls.length, first * 2, "did not fetch after the hour");
});

Deno.test("concurrent requests share one refresh", async () => {
  const { fetcher, calls } = stubFetch();
  const refresher = createToolsLive({ enabled: true, fetch: fetcher });
  await Promise.all([refresher.get(), refresher.get(), refresher.get()]);
  await refresher.settled();
  const single = calls.length;
  const again = stubFetch();
  await afterRefresh(createToolsLive({ enabled: true, fetch: again.fetcher }));
  assertEquals(single, again.calls.length);
});

Deno.test("when every call fails the page shows the committed file and the refresh never throws", async () => {
  const { fetcher } = stubFetch({ fail: () => true });
  const warnings: string[] = [];
  const live = await afterRefresh(createToolsLive({
    enabled: true,
    fetch: fetcher,
    warn: (m) => warnings.push(m),
  }));
  assertEquals(live.source, "committed");
  assertEquals(live.snapshot, committedToolsLive().snapshot);
  assert(warnings.length > 0, "a failed call was not reported");
});

Deno.test("a failed repository keeps its committed numbers while the others refresh", async () => {
  const { fetcher } = stubFetch({
    stars: 5,
    fail: (url) => url.includes("spy4x/zond"),
  });
  const live = await afterRefresh(createToolsLive({
    enabled: true,
    fetch: fetcher,
    warn: () => {},
  }));
  assertEquals(live.source, "live");
  assertEquals(live.snapshot.repos["spy4x/mig"].stars, 5);
  assertEquals(
    live.snapshot.repos["spy4x/zond"],
    committedToolsLive().snapshot.repos["spy4x/zond"],
  );
});

Deno.test("a live version replaces the pin in the version and the install command", () => {
  const ts = tool("ts-libs");
  const live = { ...committedToolsLive(), versions: { "ts-libs": "9.9.9" } };
  const got = withLiveVersion(ts, live);
  assertEquals(got.registry?.version, "9.9.9");
  assert(got.registry!.install.endsWith("@9.9.9"), got.registry!.install);
  assertEquals(withLiveVersion(ts, committedToolsLive()), ts);
});

Deno.test("the checked label says whether it is the committed file or a live check", () => {
  assert(checkedLabel(committedToolsLive()).includes("committed snapshot"));
  const live = {
    ...committedToolsLive(),
    checkedAt: "2026-09-30T14:05:00.000Z",
    source: "live" as const,
    liveRepos: tools.flatMap((t) => t.repo ? [t.repo] : []),
  };
  const label = checkedLabel(live);
  assert(label.includes("14:05 UTC") && label.includes("live"), label);
});

Deno.test("a live registry alone does not make the CI label live when GitHub and Woodpecker answer 503", async () => {
  const { fetcher } = stubFetch({
    fail: (url) => !url.startsWith("https://jsr.io/"),
  });
  const live = await afterRefresh(
    createToolsLive({ enabled: true, fetch: fetcher, warn: () => {} }),
  );
  assertEquals(live.liveRepos, []);
  assert(live.versions["ts-libs"], "the registry answer was dropped");
  assert(
    checkedLabel(live, "spy4x/mig").includes("committed snapshot"),
    checkedLabel(live, "spy4x/mig"),
  );
  assert(checkedLabel(live).includes("committed snapshot"), checkedLabel(live));
});

Deno.test("a repository is live only when its own GitHub and Woodpecker calls both succeeded", async () => {
  const { fetcher } = stubFetch({
    fail: (url) => url.includes("/api/repos/") && url.includes("/pipelines"),
  });
  const live = await afterRefresh(
    createToolsLive({ enabled: true, fetch: fetcher, warn: () => {} }),
  );
  const withCi = tools.filter((t) => t.ci).map((t) => t.repo!);
  for (const r of withCi) assert(!live.liveRepos.includes(r), `${r} live`);
});

Deno.test("a request never waits on an upstream that does not answer", async () => {
  const hang = (() => new Promise<Response>(() => {})) as typeof fetch;
  const refresher = createToolsLive({
    enabled: true,
    fetch: hang,
    warn: () => {},
  });
  const started = performance.now();
  const live = await refresher.get();
  const again = await refresher.get();
  assert(performance.now() - started < 200, "get() waited on the network");
  assertEquals(live.source, "committed");
  assertEquals(again.source, "committed");
});

Deno.test("every outbound call carries a timeout signal", async () => {
  const { fetcher, calls, signals } = stubFetch();
  await afterRefresh(createToolsLive({ enabled: true, fetch: fetcher }));
  assert(calls.length > 0);
  assertEquals(signals.length, calls.length);
  for (const s of signals) {
    assert(s instanceof AbortSignal, "no timeout signal");
  }
});
