import { define } from "../lib/utils.ts";
import { INDEXNOW_KEY } from "../lib/indexnow.ts";

/** The IndexNow key file (`lib/indexnow.ts`): the key and nothing else. */
export const handler = define.handlers({
  GET() {
    return new Response(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "max-age=86400",
      },
    });
  },
});
