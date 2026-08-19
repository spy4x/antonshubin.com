import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { crossOriginPreconnect } from "./preconnect.ts";

const SITE = "https://antonshubin.com";

Deno.test("returns the origin for a genuinely cross-origin script", () => {
  assertEquals(
    crossOriginPreconnect("https://stats.antonshubin.com/script.js", SITE),
    "https://stats.antonshubin.com",
  );
});

Deno.test("suppresses same-origin scripts (the /umami/ proxy from #66)", () => {
  assertEquals(
    crossOriginPreconnect("https://antonshubin.com/umami/script.js", SITE),
    "",
  );
});

Deno.test("suppresses relative script URLs — no origin to connect to", () => {
  assertEquals(crossOriginPreconnect("/umami/script.js", SITE), "");
  assertEquals(crossOriginPreconnect("script.js", SITE), "");
});

Deno.test("suppresses empty / unparseable input", () => {
  assertEquals(crossOriginPreconnect("", SITE), "");
  assertEquals(crossOriginPreconnect("not a url", SITE), "");
  assertEquals(crossOriginPreconnect("https://stats.example.com/s.js", ""), "");
});

Deno.test("differing port or scheme counts as cross-origin", () => {
  assertEquals(
    crossOriginPreconnect("https://antonshubin.com:8443/umami/script.js", SITE),
    "https://antonshubin.com:8443",
  );
  assertEquals(
    crossOriginPreconnect("http://antonshubin.com/umami/script.js", SITE),
    "http://antonshubin.com",
  );
});
