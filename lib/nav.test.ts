import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { navCurrent } from "./nav.ts";

Deno.test("navCurrent marks the page itself 'page'", () => {
  assertEquals(navCurrent("/catalog", "/catalog"), "page");
  assertEquals(navCurrent("/catalog/", "/catalog"), "page");
  assertEquals(navCurrent("/", "/"), "page");
});

Deno.test("navCurrent marks a section 'true' from a page inside it", () => {
  assertEquals(
    navCurrent("/catalog/zero-to-production-saas-mvp", "/catalog"),
    "true",
  );
});

Deno.test("navCurrent never marks home as the section of another page", () => {
  assertEquals(navCurrent("/blog", "/"), "false");
});

Deno.test("navCurrent does not match a path that only shares a prefix", () => {
  assertEquals(navCurrent("/tools-extra", "/tools"), "false");
  assertEquals(navCurrent("/blog", "/catalog"), "false");
});
