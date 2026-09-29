import { assert } from "jsr:@std/assert@^1.0.0";
import { INTRO_CALL } from "./catalog.ts";
import { homeDescription, META_DESCRIPTION_MAX } from "./home.ts";
import { proof } from "./proof.ts";

Deno.test("the home meta description fits a search result", () => {
  const text = homeDescription();
  assert(
    text.length <= META_DESCRIPTION_MAX,
    `${text.length} characters, expected <= ${META_DESCRIPTION_MAX}: "${text}"`,
  );
});

Deno.test("the home meta description carries the Upwork status and the first step from the data files", () => {
  const text = homeDescription();
  assert(text.includes(proof("expert-vetted")), text);
  assert(text.includes(INTRO_CALL), text);
});
