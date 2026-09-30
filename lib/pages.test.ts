import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import { CORE_PAGES } from "./cache-control.ts";
import { corePages, pagesFor } from "./pages.ts";
import { footerProfiles, profile, profiles, sameAsUrls } from "./profiles.ts";

Deno.test("every core page is in each surface it is not excluded from", () => {
  for (const page of corePages) {
    assertEquals(
      CORE_PAGES.has(page.path),
      !page.notIn?.includes("edge"),
      `${page.path} in CORE_PAGES`,
    );
    assertEquals(
      pagesFor("sitemap").some((p) => p.path === page.path),
      !page.notIn?.includes("sitemap"),
      `${page.path} in the sitemap`,
    );
  }
});

Deno.test("CORE_PAGES holds nothing that lib/pages.ts does not list", () => {
  const listed = new Set(corePages.map((p) => p.path));
  for (const path of CORE_PAGES) assert(listed.has(path), path);
});

Deno.test("core pages are listed once each and exclusions are the documented few", () => {
  const paths = corePages.map((p) => p.path);
  assertEquals(new Set(paths).size, paths.length);
  assertEquals(
    corePages.filter((p) => p.notIn).map((p) => `${p.path}:${p.notIn}`),
    ["/tools:edge", "/pay:sitemap"],
  );
});

Deno.test("profile() throws on an unknown id so a typo fails the build", () => {
  assertThrows(() => profile("myspace"));
});

Deno.test("the footer's profiles and the Person's sameAs come from one list", () => {
  for (const p of footerProfiles) assert(profiles.includes(p), p.id);
  assertEquals(sameAsUrls, profiles.map((p) => p.href));
  assertEquals(
    footerProfiles.map((p) => p.label),
    ["GitHub", "LinkedIn", "YouTube", "Upwork", "X"],
  );
});
