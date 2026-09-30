import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { isCsrfPath, siteCsrf } from "./csrf.ts";

const guard = siteCsrf("https://staging.example.com");

/** Runs the guard on a request; returns "next" when it passed, else the status. */
async function run(
  path: string,
  headers: Record<string, string>,
  method = "POST",
): Promise<string | number> {
  const url = new URL(path, "http://127.0.0.1:8000");
  // deno-lint-ignore no-explicit-any
  const ctx: any = {
    req: new Request(url, { method, headers }),
    url,
    next: () => Promise.resolve(new Response("next")),
  };
  try {
    const res = await guard(ctx);
    return (await res.text()) === "next" ? "next" : res.status;
  } catch (err) {
    return (err as { status?: number }).status ?? 500;
  }
}

Deno.test("refuses a cross-site POST to each guarded route with 403", async () => {
  for (
    const path of [
      "/api/subscribe",
      "/api/lead",
      "/unsubscribe",
      "/subscribe/confirm",
    ]
  ) {
    assertEquals(
      await run(path, {
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      }),
      403,
      path,
    );
    assertEquals(
      await run(path, { origin: "https://evil.example" }),
      403,
      path,
    );
  }
});

Deno.test("lets the site's own forms through, on the configured origin", async () => {
  assertEquals(
    await run("/api/subscribe", { origin: "https://staging.example.com" }),
    "next",
  );
  assertEquals(
    await run("/api/lead", { "sec-fetch-site": "same-origin" }),
    "next",
  );
  assertEquals(
    await run("/api/lead", { origin: "https://antonshubin.com" }),
    403,
    "production's origin is not staging's",
  );
});

Deno.test("lets a one-click unsubscribe with no Origin through", async () => {
  assertEquals(await run("/unsubscribe?token=abc", {}), "next");
});

Deno.test("leaves other paths and GET alone", async () => {
  assertEquals(
    await run("/api/other", { origin: "https://evil.example" }),
    "next",
  );
  assertEquals(
    await run("/unsubscribe", { origin: "https://evil.example" }, "GET"),
    "next",
  );
  assertEquals(isCsrfPath("/unsubscribe/"), true);
  assertEquals(isCsrfPath("/unsubscribe-me"), false);
});
