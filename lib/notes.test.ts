import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { note, notes } from "./notes.ts";

Deno.test("every note carries a source link or a checked date", () => {
  for (const n of notes) {
    assertEquals(
      Boolean(n.href) || Boolean(n.checkedOn),
      true,
      `${n.id} has neither an href nor a checkedOn`,
    );
  }
});

Deno.test("every note resolves by id", () => {
  for (const n of notes) {
    assertEquals(note(n.id), n);
  }
});

Deno.test("a typo'd note id throws instead of returning undefined", () => {
  assertThrows(() => note("upwork-profil"), Error, 'no note "upwork-profil"');
});

Deno.test("the Upwork profile note links the profile with no guessed checked date", () => {
  const n = note("upwork-profile");
  assertEquals(n.href, "https://www.upwork.com/freelancers/ashubin");
  assertEquals(n.checkedOn, undefined);
});
