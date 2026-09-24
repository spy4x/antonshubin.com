import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  cacheControlFor,
  type CacheInput,
  isStagingHost,
} from "./cache-control.ts";

const PAGE: CacheInput = {
  pathname: "/unsubscribe",
  status: 200,
  staging: false,
  current: null,
};

Deno.test("staging keeps a route's own no-store instead of revalidating it", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, staging: true, current: "no-store" }),
    undefined,
  );
});

Deno.test("production keeps a route's own no-store, even on a core page", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/", current: "no-store" }),
    undefined,
  );
});

Deno.test("staging still revalidates every HTML page without a header of its own", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, staging: true }),
    "no-cache, must-revalidate",
  );
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/", staging: true }),
    "no-cache, must-revalidate",
  );
});

Deno.test("staging still caches assets and images", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/assets/app.css", staging: true }),
    "public, max-age=31536000, immutable",
  );
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/img/me.webp", staging: true }),
    "public, max-age=604800, stale-while-revalidate=86400",
  );
});

Deno.test("production caches core pages and leaves other pages alone", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/how-i-work" }),
    "public, max-age=259200, stale-while-revalidate=43200",
  );
  assertEquals(cacheControlFor(PAGE), undefined);
});

Deno.test("an error is never cached, on either host", () => {
  for (const staging of [false, true]) {
    assertEquals(
      cacheControlFor({ ...PAGE, pathname: "/", status: 404, staging }),
      "no-store",
    );
  }
});

Deno.test("a static-file tier wins over Fresh's default no-store (#183 follow-up)", () => {
  // Fresh's staticFiles() middleware stamps `Cache-Control: no-store` by
  // default on any static file it doesn't recognise as content-hashed —
  // simulated here via `current: "no-store"`, same as production sees for
  // /fonts/*, favicons and any unstamped JS chunk.
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/assets/fonts/literata-latin-600-normal-a1b2c3d4.woff2",
      current: "no-store",
    }),
    "public, max-age=31536000, immutable",
  );
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/img/photo-mobile.webp",
      current: "no-store",
    }),
    "public, max-age=604800, stale-while-revalidate=86400",
  );
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/favicon-32x32.png",
      current: "no-store",
    }),
    "public, max-age=604800, stale-while-revalidate=86400",
  );
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/_fresh/client/assets/some-chunk-a1b2c3.js",
      current: "no-store",
    }),
    "public, max-age=31536000, immutable",
  );
});

Deno.test("a route's own no-store still wins everywhere else", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/unsubscribe", current: "no-store" }),
    undefined,
  );
});

Deno.test("recognises the staging host only", () => {
  assert(isStagingHost("website-stag.antonshubin.com"));
  assert(!isStagingHost("antonshubin.com"));
});
