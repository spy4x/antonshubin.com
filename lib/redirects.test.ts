import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { redirectTarget } from "./redirects.ts";
import { blogArticles, projects } from "./data.ts";

Deno.test("redirects a trailing-slash post URL to the slash-free form", () => {
  assertEquals(redirectTarget("/blog/ship-it-today/"), "/blog/ship-it-today");
});

Deno.test("redirects a trailing-slash project URL to the slash-free form", () => {
  assertEquals(redirectTarget("/projects/mig/"), "/projects/mig");
});

Deno.test("redirects a trailing-slash URL even for an unknown slug — the target then 404s normally", () => {
  assertEquals(redirectTarget("/blog/no-such-post/"), "/blog/no-such-post");
});

Deno.test("redirects the retired CalDAV slug to the post that absorbed it", () => {
  const target = redirectTarget("/blog/self-hosted-caldav-pwa-architecture");
  assertEquals(target, "/blog/self-hosted-caldav-web-ui-tasks-org");
});

Deno.test("resolves the retired CalDAV slug with a trailing slash in one hop, not two", () => {
  const target = redirectTarget(
    "/blog/self-hosted-caldav-pwa-architecture/",
  );
  assertEquals(target, "/blog/self-hosted-caldav-web-ui-tasks-org");
});

Deno.test("the retired CalDAV slug's target is a real post", () => {
  const target = redirectTarget("/blog/self-hosted-caldav-pwa-architecture")!;
  const slug = target.replace("/blog/", "");
  assertEquals(blogArticles.some((a) => a.slug === slug), true);
});

Deno.test("never redirects the home page", () => {
  assertEquals(redirectTarget("/"), undefined);
});

Deno.test("leaves an ordinary post or project URL alone", () => {
  assertEquals(redirectTarget("/blog/ship-it-today"), undefined);
  assertEquals(redirectTarget("/projects/mig"), undefined);
});

Deno.test("leaves unrelated trailing-slash paths alone", () => {
  assertEquals(redirectTarget("/catalog/"), undefined);
  assertEquals(redirectTarget("/blog/"), undefined);
});

Deno.test("redirects the retired homelab project to rostok, with or without a trailing slash", () => {
  assertEquals(redirectTarget("/projects/homelab"), "/projects/rostok");
  assertEquals(redirectTarget("/projects/homelab/"), "/projects/rostok");
});

Deno.test("the retired homelab slug's target is a real project and homelab itself is gone", () => {
  const all = [...projects.my, ...projects.freelance];
  assert(all.some((p) => p.slug === "rostok"), "no rostok project");
  assert(!all.some((p) => p.slug === "homelab"), "homelab is still a project");
});
