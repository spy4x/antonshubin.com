import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import { buildCsp, originOf } from "./csp.ts";

function directive(csp: string, name: string): string {
  const found = csp.split("; ").find((d) => d.startsWith(`${name} `));
  if (found === undefined) throw new Error(`no "${name}" directive in: ${csp}`);
  return found;
}

Deno.test("locks script-src to the nonce when given one, with no unsafe-inline fallback", () => {
  const csp = buildCsp({ nonce: "abc123" });
  const scriptSrc = directive(csp, "script-src");
  assertEquals(scriptSrc, "script-src 'self' 'nonce-abc123'");
  assert(
    !scriptSrc.includes("unsafe-inline"),
    "script-src may not fall back to unsafe-inline, or the point of the nonce is defeated",
  );
});

Deno.test("allows no inline script at all when there is no nonce (hand-built HTML, JSON, redirects)", () => {
  const csp = buildCsp({});
  const scriptSrc = directive(csp, "script-src");
  assertEquals(scriptSrc, "script-src 'self'");
  assert(
    !scriptSrc.includes("unsafe-inline"),
    "script-src may not fall back to unsafe-inline when there is no nonce",
  );
});

Deno.test("adds the Umami origin to script-src and connect-src only when given", () => {
  const withUmami = buildCsp({
    nonce: "n",
    umamiOrigin: "https://stats.antonshubin.com",
  });
  assertEquals(
    directive(withUmami, "script-src"),
    "script-src 'self' 'nonce-n' https://stats.antonshubin.com",
  );
  assertEquals(
    directive(withUmami, "connect-src"),
    "connect-src 'self' https://api.github.com https://stats.antonshubin.com",
  );

  const withoutUmami = buildCsp({ nonce: "n" });
  assertEquals(
    directive(withoutUmami, "script-src"),
    "script-src 'self' 'nonce-n'",
  );
  assertEquals(
    directive(withoutUmami, "connect-src"),
    "connect-src 'self' https://api.github.com",
  );
});

Deno.test("frame-src always allows YouTube and adds the booking origin only when SCHEDULE_URL is set", () => {
  const withSchedule = buildCsp({
    scheduleOrigin: "https://meet.antonshubin.com",
  });
  assertEquals(
    directive(withSchedule, "frame-src"),
    "frame-src https://www.youtube.com https://youtube.com https://meet.antonshubin.com",
  );

  const withoutSchedule = buildCsp({});
  assertEquals(
    directive(withoutSchedule, "frame-src"),
    "frame-src https://www.youtube.com https://youtube.com",
  );
});

Deno.test("style-src keeps unsafe-inline for the site's server-rendered style attributes", () => {
  assertEquals(
    directive(buildCsp({}), "style-src"),
    "style-src 'self' 'unsafe-inline'",
  );
});

Deno.test("carries the fixed, always-on directives", () => {
  const csp = buildCsp({ nonce: "n" });
  for (
    const expected of [
      "default-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]
  ) {
    assertStringIncludes(csp, expected);
  }
});

Deno.test("never sends upgrade-insecure-requests — HSTS covers prod, and it would break plain-http tests", () => {
  assert(!buildCsp({ nonce: "n" }).includes("upgrade-insecure-requests"));
});

Deno.test("originOf returns the origin of an absolute URL", () => {
  assertEquals(
    originOf("https://meet.antonshubin.com/embed?x=1"),
    "https://meet.antonshubin.com",
  );
});

Deno.test("originOf returns empty for unset, relative, or unparseable input", () => {
  assertEquals(originOf(""), "");
  assertEquals(originOf("/embed"), "");
  assertEquals(originOf("not a url"), "");
});
