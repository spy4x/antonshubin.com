import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  navCurrent,
  navItemFor,
  navLabel,
  railItems,
  sheetBottomItems,
  sheetTopItems,
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

Deno.test("the footer's Site group is the rail plus Infrastructure, About and Why not just AI", () => {
  assertEquals(
    siteItems.map((i) => i.href),
    [
      ...railItems.map((i) => i.href),
      "/infrastructure",
      "/about",
      "/why-not-just-ai",
    ],
  );
});

Deno.test("the rail lists Work, Services, Tools, How I work, then Writing", () => {
  assertEquals(
    railItems.map((i) => i.label),
    ["Work", "Services", "Tools", "How I work", "Writing"],
  );
});

Deno.test("the More sheet opens with Home then About and ends with Infrastructure", () => {
  assertEquals(sheetTopItems.map((i) => i.href), ["/", "/about"]);
  assertEquals(sheetBottomItems.map((i) => i.href), ["/infrastructure"]);
});
