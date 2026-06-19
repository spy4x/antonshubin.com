import { App, staticFiles } from "fresh";
import type { State } from "./lib/utils.ts";

export const app = new App<State>();

// Cache middleware: set immutable cache for content-hashed assets
app.use(async (ctx) => {
  const resp = await ctx.next();
  const url = ctx.url.pathname;

  // Assets with content hash in name — cache forever
  if (
    url.startsWith("/assets/") || url.startsWith("/_fresh/")
  ) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } // Images (change rarely) — cache 7 days
  else if (
    url.startsWith("/img/") || url.startsWith("/static/")
  ) {
    resp.headers.set(
      "Cache-Control",
      "public, max-age=604800, stale-while-revalidate=86400",
    );
  }

  return resp;
});

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
