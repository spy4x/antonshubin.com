import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { bareAddress } from "./email-field.ts";

Deno.test("returns a bare address, trimmed and with its case kept", () => {
  assertEquals(bareAddress("  Jane@Example.com "), "Jane@Example.com");
});

Deno.test("refuses a display name, angle brackets or quotes", () => {
  const refused = [
    "a<victim@example.com>",
    "Jane <jane@example.com>",
    `"Verify at https://evil.example"<victim@example.com>`,
    `"jane"@example.com`,
    "jane@example.com>",
    "<jane@example.com",
  ];
  for (const value of refused) {
    assertEquals(bareAddress(value), null, value);
  }
});

Deno.test("refuses a value no mail can reach", () => {
  const refused = [
    "",
    "jane",
    "jane@localhost",
    "a\u0001b@example.com",
    "\ud800x@example.com",
    "jane doe@example.com",
    undefined,
    42,
  ];
  for (const value of refused) {
    assertEquals(bareAddress(value), null, JSON.stringify(value));
  }
});
