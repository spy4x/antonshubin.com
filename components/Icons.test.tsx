import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { StarIcon } from "./Icons.tsx";

Deno.test("a filled star is filled with the text colour, an outline one is not", () => {
  assert(render(<StarIcon filled />).includes("fill-current"));
  assert(!render(<StarIcon />).includes("fill-current"));
});
