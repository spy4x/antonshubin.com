import { page } from "fresh";
import { define } from "../lib/utils.ts";
import { NotFound } from "../components/NotFound.tsx";

function notFoundResponse() {
  return page(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export const handler = define.handlers({
  GET: notFoundResponse,
  HEAD: notFoundResponse,
});

export default define.page(function NotFoundRoute(ctx) {
  return <NotFound pathname={ctx.url.pathname} />;
});
