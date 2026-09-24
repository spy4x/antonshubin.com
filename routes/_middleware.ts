// Sets X-Robots-Tag per path. Leaving analytics out for known bots happens at
// render time in routes/_app.tsx (see lib/bots.ts), not here, so no response
// body is read or rewritten.
export async function handler(
  ctx: { req: Request; url: URL; next: () => Promise<Response> },
): Promise<Response> {
  const pathname = ctx.url.pathname;
  const isStaging = ctx.url.hostname.startsWith("website-stag.");

  const res = await ctx.next();

  // ── X-Robots-Tag per path ────────────────────────────
  if (isStaging) {
    // Already set by main.ts cache middleware — preserve noindex
  } else if (
    pathname === "/pay" || pathname.startsWith("/pay/") ||
    pathname === "/unsubscribe"
  ) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.headers.set(
      "X-Robots-Tag",
      "index, follow, max-snippet:-1, max-image-preview:large",
    );
  }

  return res;
}
