export async function handler(
  ctx: { req: Request; url: URL; next: () => Promise<Response> },
): Promise<Response> {
  const pathname = ctx.url.pathname;

  const res = await ctx.next();

  if (pathname === "/pay" || pathname.startsWith("/pay/")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.headers.set(
      "X-Robots-Tag",
      "index, follow, max-snippet:-1, max-image-preview:large",
    );
  }

  return res;
}
