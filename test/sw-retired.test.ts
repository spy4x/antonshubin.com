// Rendered-page guard for the retired service worker (#285). /sw.js is now a
// script that empties the caches and unregisters itself, so browsers that
// registered the old worker end up with none. No page may register a worker,
// and the deploy still needs the `const CACHE = "antonshubin-<id>"` line.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { parseBuildId } from "../scripts/cloudflare-purge.ts";

Deno.test("/sw.js unregisters itself, clears caches, and serves no pages", async () => {
  const site = await startSite({ env: { BUILD_ID: "abc1234" } });
  try {
    const res = await site.get("/sw.js");
    const script = await res.text();
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Cache-Control"), "no-cache, must-revalidate");
    assert(script.includes("caches.delete("), "does not delete caches");
    assert(script.includes("unregister()"), "does not unregister itself");
    // Taking over an open page makes the old worker's page reload (#285), so
    // it waits unless the old page's "Reload" button asks it to take over.
    assert(!script.includes(`"install"`), "takes over open pages on install");
    assert(
      /addEventListener\("message"[\s\S]*action === "skipWaiting"[\s\S]*self\.skipWaiting\(\)/
        .test(script),
      "the old page's Reload button does nothing",
    );
    assert(!script.includes("claim("), "takes over open pages");
    assert(!script.includes(`"fetch"`), "still intercepts requests");
    assert(!script.includes("cache.addAll"), "still precaches pages");
    // scripts/cloudflare-purge.ts reads the live build from this line.
    assertEquals(parseBuildId(script), "abc1234");
  } finally {
    await site.stop();
  }
});

Deno.test("no server-rendered page mentions a service worker", async () => {
  const site = await startSite();
  try {
    for (const path of ["/", "/book", "/blog", "/tools"]) {
      const html = await site.html(path);
      assert(!html.includes("serviceWorker"), `${path} mentions a worker`);
    }
  } finally {
    await site.stop();
  }
});
