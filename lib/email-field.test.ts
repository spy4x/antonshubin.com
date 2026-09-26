import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { bareAddress } from "./email-field.ts";

Deno.test("returns a bare address, trimmed and with its case kept", () => {
  assertEquals(bareAddress("  Jane@Example.com "), "Jane@Example.com");
});

Deno.test("refuses a display name, angle brackets or quotes", () => {
  const refused = [
    `"Your-account-is-locked,verify-at-https://evil.example/x"<victim@example.com>`,
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
    ["jane@example.com"],
  ];
  for (const value of refused) {
    assertEquals(bareAddress(value), null, JSON.stringify(value));
  }
});

Deno.test("accepts an address of 254 characters with a local part of 64", () => {
  const local = "a".repeat(64);
  const domain = `${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;
  const address = `${local}@${domain}`;
  assertEquals(address.length, 254);
  assertEquals(bareAddress(address), address);
});

Deno.test("refuses an address over 254 characters or a local part over 64", () => {
  const domain = `${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.com`;
  const long = `${"a".repeat(64)}@${domain}`;
  assertEquals(long.length, 255);
  assertEquals(bareAddress(long), null);
  assertEquals(bareAddress(`${"a".repeat(65)}@example.com`), null);
  assertEquals(bareAddress(`${"a".repeat(1_000_000)}@example.com`), null);
});
