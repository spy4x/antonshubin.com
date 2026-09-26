import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { proof, proofFigures } from "./proof.ts";

Deno.test("every proof figure resolves by id", () => {
  for (const figure of proofFigures) {
    assertEquals(proof(figure.id), figure.value);
  }
});

Deno.test("a typo'd proof figure id throws instead of returning undefined", () => {
  assertThrows(() => proof("300k"), Error, 'no proof figure "300k"');
});
