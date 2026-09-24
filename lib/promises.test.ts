import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { decapitalize, promise, promises } from "./promises.ts";

Deno.test("there are exactly five promises", () => {
  assertEquals(promises.length, 5);
});

Deno.test("every promise resolves by id", () => {
  for (const p of promises) {
    assertEquals(promise(p.id), p);
  }
});

Deno.test("a typo'd promise id throws instead of returning undefined", () => {
  assertThrows(() => promise("refunds"), Error, 'no promise "refunds"');
});

Deno.test("decapitalize lowercases only the first letter", () => {
  assertEquals(
    decapitalize("If in the first five days"),
    "if in the first five days",
  );
  assertEquals(decapitalize(""), "");
});
