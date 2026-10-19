// The tool clips under /video/* (#454). Safari plays an MP4 only from a
// server that answers a `Range` request with 206 Partial Content, and Fresh's
// staticFiles() ignores `Range`, so `main.ts` serves these files with
// @std/http's serveFile (206 and 416, `Accept-Ranges`, `ETag`) before
// staticFiles() runs. The cache middleware in `main.ts` still sets their
// Cache-Control (lib/cache-control.ts).
import { serveFile } from "@std/http/file-server";
import { join, normalize, SEPARATOR } from "@std/path";

/** The part of the middleware context {@link serveVideo} reads. */
export interface VideoContext {
  req: Request;
  url: URL;
  /** Fresh's root: `_fresh/` in a production build, whose `client/` holds `static/`'s files. */
  config: { root: string };
  next: () => Promise<Response>;
}

/**
 * Serves `/video/<path>` from the build's `client/video/` with `serveFile`.
 * Any other path, a method other than GET or HEAD, or a file the build does
 * not have (the Vite dev server serves `static/` itself) goes to `next()`.
 */
export async function serveVideo(ctx: VideoContext): Promise<Response> {
  const { pathname } = ctx.url;
  const method = ctx.req.method;
  if (
    !pathname.startsWith("/video/") || (method !== "GET" && method !== "HEAD")
  ) {
    return await ctx.next();
  }
  const base = join(ctx.config.root, "client", "video");
  let file: string;
  try {
    file = normalize(
      join(base, decodeURIComponent(pathname.slice("/video/".length))),
    );
  } catch {
    return await ctx.next();
  }
  if (!file.startsWith(base + SEPARATOR)) return await ctx.next();
  const info = await Deno.stat(file).catch(() => null);
  if (!info?.isFile) return await ctx.next();
  return await serveFile(ctx.req, file, { fileInfo: info });
}
