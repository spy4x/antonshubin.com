import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { formatCheckedOn } from "./Note.tsx";

Deno.test("a checked date reads day, short month, year", () => {
  assertEquals(formatCheckedOn("2026-09-26"), "26 Sep 2026");
  assertEquals(formatCheckedOn("2026-01-05"), "5 Jan 2026");
});
