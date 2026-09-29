import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { purgeUrls } from "@spy4x/integrations/cloudflare";
import {
  API_TIMEOUT_MS,
  envValue,
  liveBuildId,
  parseBuildId,
  purgeAfterDeploy,
  purgeList,
  staticUrls,
  waitForBuild,
} from "./cloudflare-purge.ts";

const TOKEN = "test-token-not-real";

interface Call {
  url: string;
  init?: RequestInit;
}

/** A fetch stub that records each call and answers from `respond`. */
function stubFetch(respond: (call: Call, index: number) => Response) {
  const calls: Call[] = [];
  const fetch = (input: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(input), init };
    calls.push(call);
    return Promise.resolve(respond(call, calls.length - 1));
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

Deno.test("parseBuildId reads the commit hash from a served sw.js", () => {
  const sw = `// Cache version\nconst CACHE = "antonshubin-b7910f3";\n`;
  assertEquals(parseBuildId(sw), "b7910f3");
});

Deno.test("parseBuildId returns nothing for a dev build or a 404 page", () => {
  assertEquals(parseBuildId(`const CACHE = "antonshubin-dev";`), undefined);
  assertEquals(parseBuildId("404 page not found"), undefined);
});

Deno.test("staticUrls maps static/ paths to public URLs and ignores the rest", () => {
  assertEquals(
    staticUrls("antonshubin.com", [
      "static/img/hero.webp",
      "static/favicon.ico",
      "routes/index.tsx",
      "static/img/two words.png",
    ]),
    [
      "https://antonshubin.com/img/hero.webp",
      "https://antonshubin.com/favicon.ico",
      "https://antonshubin.com/img/two%20words.png",
    ],
  );
});

Deno.test("purgeList always starts with sw.js on the target's own domain, without duplicates", () => {
  assertEquals(purgeList("website-stag.antonshubin.com", []), [
    "https://website-stag.antonshubin.com/sw.js",
  ]);
  assertEquals(
    purgeList("antonshubin.com", ["static/sw.js", "static/manifest.json"]),
    [
      "https://antonshubin.com/sw.js",
      "https://antonshubin.com/manifest.json",
    ],
  );
});

Deno.test("envValue reads one key and treats an empty value as unset", () => {
  const text = `# comment\nOTHER=x\nCLOUDFLARE_API_TOKEN="abc"\n`;
  assertEquals(envValue(text, "CLOUDFLARE_API_TOKEN"), "abc");
  assertEquals(
    envValue("CLOUDFLARE_API_TOKEN=\n", "CLOUDFLARE_API_TOKEN"),
    undefined,
  );
  assertEquals(envValue("OTHER=x", "CLOUDFLARE_API_TOKEN"), undefined);
});

Deno.test("liveBuildId reads the live build and bypasses the edge cache", async () => {
  const { calls, fetch } = stubFetch(() =>
    new Response(`const CACHE = "antonshubin-abc1234";`)
  );
  assertEquals(await liveBuildId("antonshubin.com", fetch), "abc1234");
  assert(calls[0].url.startsWith("https://antonshubin.com/sw.js?"));

  const notFound = stubFetch(() =>
    new Response("404 page not found", { status: 404 })
  );
  assertEquals(await liveBuildId("antonshubin.com", notFound.fetch), undefined);
});

Deno.test("waitForBuild returns once sw.js serves the new build", async () => {
  const bodies = ["404 page not found", `const CACHE = "antonshubin-a0a1234";`];
  const { calls, fetch } = stubFetch((_, i) =>
    new Response(bodies[i] ?? `const CACHE = "antonshubin-bee5678";`, {
      status: i === 0 ? 404 : 200,
    })
  );
  let clock = 0;
  const ok = await waitForBuild({
    domain: "antonshubin.com",
    buildId: "bee5678",
    fetch,
    sleep: (ms) => Promise.resolve(void (clock += ms)),
    now: () => clock,
  });
  assertEquals(ok, true);
  assertEquals(calls.length, 3);
});

Deno.test("waitForBuild gives up after the timeout", async () => {
  const { calls, fetch } = stubFetch(() =>
    new Response(`const CACHE = "antonshubin-a0a1234";`)
  );
  let clock = 0;
  const ok = await waitForBuild({
    domain: "antonshubin.com",
    buildId: "bee5678",
    timeoutMs: 60_000,
    intervalMs: 2_000,
    fetch,
    sleep: (ms) => Promise.resolve(void (clock += ms)),
    now: () => clock,
  });
  assertEquals(ok, false);
  assertEquals(calls.length, 31);
  assertEquals(clock, 60_000);
});

/**
 * A fetch that never answers on its own: like the real one, it rejects only
 * when the request's signal aborts. Without a signal it would hang forever.
 */
function stalledFetch() {
  let calls = 0;
  const fetch = (_input: string | URL | Request, init?: RequestInit) => {
    calls++;
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(init.signal?.reason),
      );
    });
  };
  return { fetch: fetch as typeof globalThis.fetch, calls: () => calls };
}

/** Fails the test loudly instead of letting a hung promise stall the run. */
async function within<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: number | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`still pending after ${ms} ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

Deno.test("waitForBuild returns false when every sw.js request stalls", async () => {
  const { fetch, calls } = stalledFetch();
  let clock = 0;
  const ok = await within(
    2_000,
    waitForBuild({
      domain: "antonshubin.com",
      buildId: "bee5678",
      timeoutMs: 4_000,
      intervalMs: 2_000,
      requestTimeoutMs: 20,
      fetch,
      sleep: (ms) => Promise.resolve(void (clock += ms)),
      now: () => clock,
    }),
  );
  assertEquals(ok, false);
  assertEquals(calls(), 3);
});

Deno.test("liveBuildId answers undefined when the read stalls", async () => {
  const { fetch } = stalledFetch();
  assertEquals(
    await within(2_000, liveBuildId("antonshubin.com", fetch, 20)),
    undefined,
  );
});

type PurgeOptions = Parameters<typeof purgeUrls>[0];
type PurgeResult = Awaited<ReturnType<typeof purgeUrls>>;

/**
 * Stubs for purgeAfterDeploy: sw.js serves `live`, and the purge client
 * records each call's options and answers `result` without any request.
 */
function deployFetch(
  live: string,
  result: PurgeResult = { success: true, output: "purged", error: "" },
) {
  const purged: string[][] = [];
  const purgeCalls: PurgeOptions[] = [];
  const { fetch } = stubFetch((call) => {
    if (call.url.includes("/sw.js")) {
      return new Response(`const CACHE = "antonshubin-${live}";`);
    }
    throw new Error(`unexpected request to ${call.url}`);
  });
  const purge = (options: PurgeOptions) => {
    purgeCalls.push(options);
    purged.push([...options.urls]);
    return Promise.resolve(result);
  };
  return { fetch, purge, purged, purgeCalls };
}

const quickWait = {
  timeoutMs: 0,
  intervalMs: 1,
  sleep: () => Promise.resolve(),
};

Deno.test("purgeAfterDeploy purges only /sw.js when the previous build is unknown", async () => {
  const { fetch, purge, purged } = deployFetch("bee5678");
  const gitCalls: string[][] = [];
  const warnings: string[] = [];
  await purgeAfterDeploy({
    domain: "antonshubin.com",
    buildId: "bee5678",
    previousBuildId: undefined,
    git: (args) => {
      gitCalls.push(args);
      return Promise.resolve({ code: 0, stdout: "static/img/a.png\n" });
    },
    token: () => TOKEN,
    fetch,
    purge,
    log: () => {},
    warn: (message) => warnings.push(message),
    wait: quickWait,
  });
  assertEquals(purged, [["https://antonshubin.com/sw.js"]]);
  assertEquals(gitCalls, []);
  assert(
    warnings.some((w) => w.includes("purging /sw.js only")),
    warnings.join("\n"),
  );
});

Deno.test("purgeAfterDeploy purges sw.js and the static files changed since the live build", async () => {
  const { fetch, purge, purged } = deployFetch("bee5678");
  const gitCalls: string[][] = [];
  await purgeAfterDeploy({
    domain: "antonshubin.com",
    buildId: "bee5678",
    previousBuildId: "a0a1234",
    git: (args) => {
      gitCalls.push(args);
      return Promise.resolve({
        code: 0,
        stdout: "static/img/a.png\nstatic/favicon.ico\n",
      });
    },
    token: () => TOKEN,
    fetch,
    purge,
    log: () => {},
    warn: () => {},
    wait: quickWait,
  });
  assertEquals(purged, [[
    "https://antonshubin.com/sw.js",
    "https://antonshubin.com/img/a.png",
    "https://antonshubin.com/favicon.ico",
  ]]);
  assertEquals(gitCalls[1], [
    "diff",
    "--name-only",
    "--no-renames",
    "a0a1234",
    "bee5678",
    "--",
    "static/",
  ]);
});

Deno.test("purgeAfterDeploy resolves with a warning when a dependency throws", async () => {
  const { fetch, purge } = deployFetch("bee5678");
  const base = {
    domain: "antonshubin.com",
    buildId: "bee5678",
    previousBuildId: "a0a1234",
    fetch,
    purge,
    log: () => {},
    wait: quickWait,
  };

  const gitWarnings: string[] = [];
  await purgeAfterDeploy({
    ...base,
    git: () => Promise.reject(new Error("git exploded")),
    token: () => TOKEN,
    warn: (message) => gitWarnings.push(message),
  });
  assert(
    gitWarnings.some((w) => w.includes("git exploded")),
    gitWarnings.join("\n"),
  );

  const tokenWarnings: string[] = [];
  await purgeAfterDeploy({
    ...base,
    git: () => Promise.resolve({ code: 0, stdout: "" }),
    token: () => {
      throw new Error("token file unreadable");
    },
    warn: (message) => tokenWarnings.push(message),
  });
  assert(
    tokenWarnings.some((w) => w.includes("token file unreadable")),
    tokenWarnings.join("\n"),
  );

  const purgeWarnings: string[] = [];
  await purgeAfterDeploy({
    ...base,
    git: () => Promise.resolve({ code: 0, stdout: "" }),
    token: () => TOKEN,
    purge: () => Promise.reject(new Error("purge client exploded")),
    warn: (message) => purgeWarnings.push(message),
  });
  assert(
    purgeWarnings.some((w) => w.includes("purge client exploded")),
    purgeWarnings.join("\n"),
  );
});

Deno.test("purgeAfterDeploy skips the purge with a warning when there is no token", async () => {
  const { fetch, purge, purged } = deployFetch("bee5678");
  const warnings: string[] = [];
  await purgeAfterDeploy({
    domain: "antonshubin.com",
    buildId: "bee5678",
    previousBuildId: undefined,
    git: () => Promise.resolve({ code: 0, stdout: "" }),
    token: () => undefined,
    fetch,
    purge,
    log: () => {},
    warn: (message) => warnings.push(message),
    wait: quickWait,
  });
  assertEquals(purged, []);
  assert(
    warnings.some((w) => w.includes("CLOUDFLARE_API_TOKEN missing")),
    warnings.join("\n"),
  );
});

Deno.test("purgeAfterDeploy asks purgeUrls for the antonshubin.com zone with a 10 s limit per call", async () => {
  const { fetch, purge, purgeCalls } = deployFetch("bee5678");
  const logs: string[] = [];
  await purgeAfterDeploy({
    domain: "website-stag.antonshubin.com",
    buildId: "bee5678",
    previousBuildId: undefined,
    git: () => Promise.resolve({ code: 0, stdout: "" }),
    token: () => TOKEN,
    fetch,
    purge,
    log: (message) => logs.push(message),
    warn: () => {},
    wait: quickWait,
  });
  assertEquals(purgeCalls.length, 1);
  const call = purgeCalls[0];
  assertEquals(call.token, TOKEN);
  assertEquals(call.zoneName, "antonshubin.com");
  assertEquals(call.zoneId, undefined);
  assertEquals(call.urls, ["https://website-stag.antonshubin.com/sw.js"]);
  assertEquals(call.requestTimeoutMs, API_TIMEOUT_MS);
  assertEquals(API_TIMEOUT_MS, 10_000);
  assertEquals(call.fetch, fetch);
  assert(logs.some((l) => l.includes("Cloudflare: purged")), logs.join("\n"));
});

Deno.test("purgeAfterDeploy resolves with a warning when purgeUrls reports a failure", async () => {
  const { fetch, purge } = deployFetch("bee5678", {
    success: false,
    output: "",
    error: "zone lookup for antonshubin.com failed (HTTP 403)",
  });
  const logs: string[] = [];
  const warnings: string[] = [];
  await purgeAfterDeploy({
    domain: "antonshubin.com",
    buildId: "bee5678",
    previousBuildId: undefined,
    git: () => Promise.resolve({ code: 0, stdout: "" }),
    token: () => TOKEN,
    fetch,
    purge,
    log: (message) => logs.push(message),
    warn: (message) => warnings.push(message),
    wait: quickWait,
  });
  assert(
    warnings.some((w) =>
      w.includes("Cloudflare purge skipped: zone lookup for antonshubin.com")
    ),
    warnings.join("\n"),
  );
  assert(!logs.some((l) => l.includes("Cloudflare:")), logs.join("\n"));
});

Deno.test("purgeAfterDeploy gives up on a stalled Cloudflare call with a warning and never prints the token", async () => {
  const stalled = stalledFetch();
  // sw.js answers at once; every Cloudflare API call stalls until its signal aborts.
  const fetch =
    ((input: string | URL | Request, init?: RequestInit) =>
      String(input).includes("/sw.js")
        ? Promise.resolve(new Response(`const CACHE = "antonshubin-bee5678";`))
        : stalled.fetch(input, init)) as typeof globalThis.fetch;
  const output: string[] = [];
  await within(
    2_000,
    purgeAfterDeploy({
      domain: "antonshubin.com",
      buildId: "bee5678",
      previousBuildId: undefined,
      git: () => Promise.resolve({ code: 0, stdout: "" }),
      token: () => TOKEN,
      fetch,
      log: (message) => output.push(message),
      warn: (message) => output.push(message),
      wait: quickWait,
      requestTimeoutMs: 20,
    }),
  );
  assertEquals(stalled.calls(), 1);
  assert(
    output.some((line) => line.includes("Cloudflare purge skipped:")),
    output.join("\n"),
  );
  assert(!output.some((line) => line.includes(TOKEN)), output.join("\n"));
});
