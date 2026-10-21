import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { cacheControlFor, type CacheInput } from "./cache-control.ts"

const PAGE: CacheInput = {
  pathname: "/unsubscribe",
  status: 200,
  current: null,
}

Deno.test("production keeps a route's own no-store, even on a core page", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/", current: "no-store" }),
    undefined,
  )
})

Deno.test("production caches core pages and leaves other pages alone", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/how-i-work" }),
    "public, max-age=259200, stale-while-revalidate=43200",
  )
  assertEquals(cacheControlFor(PAGE), undefined)
})

Deno.test("an error is never cached, even on a core page", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/", status: 404 }),
    "no-store",
  )
})

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
  )
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/img/photo-mobile.webp",
      current: "no-store",
    }),
    "public, max-age=604800, stale-while-revalidate=86400",
  )
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/favicon-32x32.png",
      current: "no-store",
    }),
    "public, max-age=604800, stale-while-revalidate=86400",
  )
  assertEquals(
    cacheControlFor({
      ...PAGE,
      pathname: "/_fresh/client/assets/some-chunk-a1b2c3.js",
      current: "no-store",
    }),
    "public, max-age=31536000, immutable",
  )
})

Deno.test("a route's own no-store still wins everywhere else", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/unsubscribe", current: "no-store" }),
    undefined,
  )
})

Deno.test("production caches /about as a core page", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/about" }),
    "public, max-age=259200, stale-while-revalidate=43200",
  )
})

Deno.test("the tools hub and every tool page are kept for an hour, not three days", () => {
  for (const pathname of ["/tools", "/tools/mig", "/tools/ts-libs"]) {
    const value = cacheControlFor({ ...PAGE, pathname })
    assertEquals(
      value,
      "public, max-age=3600, stale-while-revalidate=600",
      pathname,
    )
  }
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/work" }),
    "public, max-age=259200, stale-while-revalidate=43200",
  )
})

Deno.test("a missing tool page is never cached", () => {
  assertEquals(
    cacheControlFor({ ...PAGE, pathname: "/tools/no-such-tool", status: 404 }),
    "no-store",
  )
})

Deno.test("a tool page's demo clip and poster get the image tier, even over Fresh's no-store", () => {
  for (
    const pathname of [
      "/video/tools/oko/demo.webm",
      "/video/tools/oko/demo.mp4",
      "/video/tools/oko/poster.webp",
    ]
  ) {
    assertEquals(
      cacheControlFor({ ...PAGE, pathname, current: "no-store" }),
      "public, max-age=604800, stale-while-revalidate=86400",
      pathname,
    )
  }
})
