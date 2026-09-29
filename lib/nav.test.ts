import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  moreItems,
  navCurrent,
  navItemFor,
  navLabel,
  railItems,
  siteItems,
} from "./nav.ts";

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

Deno.test("navLabel gives the nav's own word for a section, not the URL's", () => {
  assertEquals(navLabel("/blog"), "Writing");
  assertEquals(navLabel("/catalog"), "Services");
  assertEquals(navLabel("/work"), "Work");
  assertEquals(navLabel("/hackathons"), undefined);
});

Deno.test("navItemFor finds the section a path is inside, and never Home", () => {
  assertEquals(navItemFor("/blog/some-post")?.label, "Writing");
  assertEquals(navItemFor("/blog/")?.label, "Writing");
  assertEquals(navItemFor("/tools-extra"), undefined);
  assertEquals(navItemFor("/no-such-page"), undefined);
  assertEquals(navItemFor("/"), undefined);
});

Deno.test("the footer's Site group is the rail plus Infrastructure and About", () => {
  assertEquals(
    siteItems.map((i) => i.href),
    [...railItems.map((i) => i.href), "/infrastructure", "/about"],
  );
});

Deno.test("the More sheet lists About right after Home", () => {
  assertEquals(
    moreItems.slice(0, 2).map((i) => i.href),
    ["/", "/about"],
  );
});
