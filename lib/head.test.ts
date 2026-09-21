// Colocated test for the default `<head>` values in `./head.ts`.
//
// `./head.ts` imports `./config.ts`, which reads the `DOMAIN` env var at
// module load — `deno task test` runs with no permissions, so evaluating
// that import chain throws `NotCapable`. Reading the source as a text
// module (no runtime `Deno.env`/`Deno.readTextFile` call, so no
// permission check) sidesteps that without granting the test suite env
// access it otherwise has no need for.
import { assert } from "jsr:@std/assert@^1.0.0";
import headSource from "./head.ts" with { type: "text" };

Deno.test("default description stays within the 160-char meta description limit", () => {
  const match = headSource.match(/description:\s*\n?\s*"([^"]*)"/);
  assert(match, "could not find `description:` in lib/head.ts's DEFAULTS");
  const description = match[1];
  assert(
    description.length <= 160,
    `description is ${description.length} chars, expected <= 160: "${description}"`,
  );
});
