// Bot detection for the Umami analytics script moved to lib/bots.ts, used by
// routes/_app.tsx at render time (issue #179) — no response body to read or
// rewrite here anymore.
export async function handler(
  ctx: { req: Request; url: URL; next: () => Promise<Response> },
): Promise<Response> {
  const pathname = ctx.url.pathname;
  const isStaging = ctx.url.hostname.startsWith("website-stag.");

  const res = await ctx.next();

  // ── X-Robots-Tag per path ────────────────────────────
  if (isStaging) {
    // Already set by main.ts cache middleware — preserve noindex
  } else if (pathname === "/pay" || pathname.startsWith("/pay/")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.headers.set(
      "X-Robots-Tag",
      "index, follow, max-snippet:-1, max-image-preview:large",
    );
  }

  return res;
}
