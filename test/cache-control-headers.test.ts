// Rendered-page guard for the #183 follow-up fixed alongside #184: Fresh's
// staticFiles() middleware stamps a plain `Cache-Control: no-store` by
// default on any static file it doesn't itself recognise as content-hashed,
// and lib/cache-control.ts used to check that existing header *before*
// checking whether the path was a recognised asset/image/static file — so
// the static-file tiers never actually applied to a hashed font, an /img/
// file, a favicon or a JS chunk. lib/cache-control.test.ts covers the pure
// function directly; this test proves the fix holds through the real
// static-file middleware too, by fetching an actual path discovered from a
// built page's HTML rather than a guessed one.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("a hashed font, an /img file and a JS chunk get their real cache tier, not Fresh's no-store default", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/");

    const cssHref = html.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1];
    assert(cssHref, "could not find the client CSS href in / 's HTML");
    const css = await site.html(cssHref);
    const fontUrl = css.match(/url\((\/assets\/[^)]+\.woff2)\)/)?.[1];
    assert(fontUrl, "could not find a font url() in the built stylesheet");

    const fontRes = await site.get(fontUrl);
    assertEquals(fontRes.status, 200);
    assertEquals(
      fontRes.headers.get("cache-control"),
      "public, max-age=31536000, immutable",
      `${fontUrl} must be cached as an immutable asset`,
    );
    fontRes.body?.cancel();

    // Islands are booted from a same-page inline module (not a <script
    // src=...>) that imports each chunk by path — see routes/_app.tsx and
    // Fresh's client boot code.
    const jsChunk = html.match(/"(\/assets\/client-entry-[^"]+\.js)"/)?.[1];
    assert(jsChunk, "could not find the client-entry JS chunk in / 's HTML");
    const jsRes = await site.get(jsChunk);
    assertEquals(jsRes.status, 200);
    assertEquals(
      jsRes.headers.get("cache-control"),
      "public, max-age=31536000, immutable",
      `${jsChunk} must be cached as an immutable asset`,
    );
    jsRes.body?.cancel();

    const imgRes = await site.get("/img/photo-mobile.webp");
    assertEquals(imgRes.status, 200);
    assertEquals(
      imgRes.headers.get("cache-control"),
      "public, max-age=604800, stale-while-revalidate=86400",
      "/img/photo-mobile.webp must be cached as an image",
    );
    imgRes.body?.cancel();

    const favRes = await site.get("/favicon-32x32.png");
    assertEquals(favRes.status, 200);
    assertEquals(
      favRes.headers.get("cache-control"),
      "public, max-age=604800, stale-while-revalidate=86400",
      "/favicon-32x32.png must be cached like an image",
    );
    favRes.body?.cancel();

    // The deliberate exception: a route's own no-store still wins.
    const unsubRes = await site.get("/unsubscribe");
    assertEquals(unsubRes.headers.get("cache-control"), "no-store");
    unsubRes.body?.cancel();
  } finally {
    await site.stop();
  }
});
