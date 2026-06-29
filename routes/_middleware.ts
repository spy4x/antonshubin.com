export async function handler(
  req: Request,
  ctx: { next: () => Promise<Response> },
): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

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
