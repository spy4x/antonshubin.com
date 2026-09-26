import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  buildRedirectTable,
  redirectTable,
  redirectTarget,
} from "./redirects.ts";
import { blogArticles, projects } from "./data.ts";
import { findWorkProject } from "./work.ts";
import { findTool } from "./tools.ts";

/**
 * Every old `/projects` URL and its new home, written out here on purpose:
 * the test must not read its expectation from the data the table is built
 * from, or a project dropped from `lib/data.ts` would silently lose its 301.
 */
const EXPECTED_PROJECT_REDIRECTS: Record<string, string> = {
  "/projects": "/work",
  // The 12 client projects.
  "/projects/smartlite": "/work/smartlite",
  "/projects/truth-or-dare": "/work/truth-or-dare",
  "/projects/foodrazor": "/work/foodrazor",
  "/projects/corecircle": "/work/corecircle",
  "/projects/roley": "/work/roley",
  "/projects/sogroya": "/work/sogroya",
  "/projects/connectful": "/work/connectful",
  "/projects/gopingu": "/work/gopingu",
  "/projects/microwork": "/work/microwork",
  "/projects/calltrack": "/work/calltrack",
  "/projects/sajari": "/work/sajari",
  "/projects/code-review": "/work/code-review",
  // My own projects: none has a /tools/<slug> page yet, so each keeps its page under /work.
  "/projects/financy": "/work/financy",
  "/projects/air-quality-sensor": "/work/air-quality-sensor",
  "/projects/toread-today": "/work/toread-today",
  "/projects/todoapp-caldav": "/work/todoapp-caldav",
  "/projects/caldav-mcp": "/work/caldav-mcp",
  "/projects/zond": "/work/zond",
  "/projects/rostok": "/work/rostok",
  "/projects/template": "/work/template",
  "/projects/mig": "/work/mig",
  // #231: homelab was reborn as rostok.
  "/projects/homelab": "/work/rostok",
};

Deno.test("every old /projects URL redirects to its new home", () => {
  for (const [from, to] of Object.entries(EXPECTED_PROJECT_REDIRECTS)) {
    assertEquals(redirectTarget(from), to, from);
  }
});

Deno.test("every old /projects URL with a trailing slash redirects in the same one hop", () => {
  for (const [from, to] of Object.entries(EXPECTED_PROJECT_REDIRECTS)) {
    assertEquals(redirectTarget(`${from}/`), to, `${from}/`);
  }
});

Deno.test("the table holds no /projects URL beyond the expected ones", () => {
  const extra = [...redirectTable.keys()]
    .filter((k) => k.startsWith("/projects"))
    .map((k) => k.replace(/(.)\/$/, "$1"))
    .filter((k) => !(k in EXPECTED_PROJECT_REDIRECTS));
  assertEquals(extra, []);
});

Deno.test("no redirect lands on another redirect", () => {
  for (const [from, to] of redirectTable) {
    assertEquals(redirectTarget(to), undefined, `${from} -> ${to} chains`);
  }
});

Deno.test("every /projects redirect lands on a page that exists", () => {
  for (const to of new Set(redirectTable.values())) {
    if (to === "/work" || to.startsWith("/blog/")) continue;
    const [, section, slug] = to.split("/");
    const found = section === "tools" ? findTool(slug) : findWorkProject(slug);
    assert(found, `${to} has no page`);
  }
});

Deno.test("a /projects slug that has a tool page redirects to the tool page", () => {
  const table = buildRedirectTable({
    workSlugs: ["some-tool", "client-app"],
    toolSlugs: ["some-tool"],
  });
  assertEquals(
    redirectTarget("/projects/some-tool", table),
    "/tools/some-tool",
  );
  assertEquals(
    redirectTarget("/projects/some-tool/", table),
    "/tools/some-tool",
  );
  assertEquals(
    redirectTarget("/projects/client-app", table),
    "/work/client-app",
  );
});

Deno.test("an unknown /projects slug is not redirected, so it answers 404", () => {
  assertEquals(redirectTarget("/projects/no-such-project"), undefined);
  assertEquals(redirectTarget("/projects/no-such-project/"), undefined);
});

Deno.test("redirects a trailing-slash post URL to the slash-free form", () => {
  assertEquals(redirectTarget("/blog/ship-it-today/"), "/blog/ship-it-today");
});

Deno.test("redirects a trailing-slash work URL to the slash-free form", () => {
  assertEquals(redirectTarget("/work/mig/"), "/work/mig");
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

Deno.test("leaves an ordinary post or work URL alone", () => {
  assertEquals(redirectTarget("/blog/ship-it-today"), undefined);
  assertEquals(redirectTarget("/work/mig"), undefined);
  assertEquals(redirectTarget("/work"), undefined);
});

Deno.test("leaves unrelated trailing-slash paths alone", () => {
  assertEquals(redirectTarget("/catalog/"), undefined);
  assertEquals(redirectTarget("/blog/"), undefined);
});

Deno.test("the retired homelab slug's target is a real project and homelab itself is gone", () => {
  const all = [...projects.my, ...projects.freelance];
  assert(all.some((p) => p.slug === "rostok"), "no rostok project");
  assert(!all.some((p) => p.slug === "homelab"), "homelab is still a project");
});
