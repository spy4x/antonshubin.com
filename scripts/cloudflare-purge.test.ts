import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  batches,
  envValue,
  liveBuildId,
  parseBuildId,
  PURGE_BATCH_SIZE,
  purgeCloudflare,
  purgeList,
  staticUrls,
  waitForBuild,
} from "./cloudflare-purge.ts";

const TOKEN = "test-token-not-real";
const ZONE_ID = "0123456789abcdef0123456789abcdef";

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const zoneFound = () =>
  json({ success: true, result: [{ id: ZONE_ID, name: "antonshubin.com" }] });

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

Deno.test("batches splits into groups of at most the given size", () => {
  const items = Array.from({ length: 61 }, (_, i) => i);
  assertEquals(batches(items, 30).map((b) => b.length), [30, 30, 1]);
  assertEquals(batches([], 30), []);
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

Deno.test("purgeCloudflare looks the zone up by name and purges in batches of 30", async () => {
  const urls = Array.from(
    { length: 31 },
    (_, i) => `https://antonshubin.com/img/${i}.png`,
  );
  const { calls, fetch } = stubFetch((_, i) =>
    i === 0 ? zoneFound() : json({ success: true })
  );
  const result = await purgeCloudflare({ token: TOKEN, urls, fetch });

  assertEquals(result, {
    success: true,
    output: "purged 31 URL(s) from Cloudflare",
    error: "",
  });
  assertEquals(calls.length, 3);
  assertEquals(
    calls[0].url,
    "https://api.cloudflare.com/client/v4/zones?name=antonshubin.com",
  );
  const purges = calls.slice(1);
  for (const call of purges) {
    assertEquals(
      call.url,
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    );
    assertEquals(call.init?.method, "POST");
    assertEquals(
      (call.init?.headers as Record<string, string>).Authorization,
      `Bearer ${TOKEN}`,
    );
  }
  const sent = purges.map((c) =>
    JSON.parse(String(c.init?.body)).files as string[]
  );
  assertEquals(sent.map((files) => files.length), [PURGE_BATCH_SIZE, 1]);
  assertEquals(sent.flat(), urls);
});

Deno.test("purgeCloudflare reports an API error without throwing or echoing the token", async () => {
  const { fetch } = stubFetch((_, i) =>
    i === 0 ? zoneFound() : json(
      { success: false, errors: [{ code: 10000, message: "Auth" }] },
      403,
    )
  );
  const result = await purgeCloudflare({
    token: TOKEN,
    urls: ["https://antonshubin.com/sw.js"],
    fetch,
  });

  assertEquals(result.success, false);
  assertEquals(
    result.error,
    "purge failed after 0 of 1 URL(s) (HTTP 403: 10000 Auth)",
  );
  assert(!JSON.stringify(result).includes(TOKEN));
});

Deno.test("purgeCloudflare treats an HTTP 200 answer marked unsuccessful as a failure", async () => {
  const { fetch } = stubFetch((_, i) =>
    i === 0
      ? zoneFound()
      : json({ success: false, errors: [{ code: 1134, message: "Busy" }] })
  );
  const result = await purgeCloudflare({
    token: TOKEN,
    urls: ["https://antonshubin.com/sw.js"],
    fetch,
  });
  assertEquals(result.success, false);
  assertEquals(
    result.error,
    "purge failed after 0 of 1 URL(s) (HTTP 200: 1134 Busy)",
  );
});

Deno.test("purgeCloudflare reports a missing zone and a network failure as errors", async () => {
  const missing = stubFetch(() => json({ success: true, result: [] }));
  const noZone = await purgeCloudflare({
    token: TOKEN,
    urls: ["u"],
    fetch: missing.fetch,
  });
  assertEquals(noZone.success, false);
  assertEquals(missing.calls.length, 1);

  const offline =
    (() => Promise.reject(new TypeError("network down"))) as typeof fetch;
  const down = await purgeCloudflare({
    token: TOKEN,
    urls: ["u"],
    fetch: offline,
  });
  assertEquals(down, {
    success: false,
    output: "",
    error: "Cloudflare request failed: network down",
  });
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
