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
  // My own projects moved to /tools (#273); todoapp-caldav is now caldav-tasks-web.
  "/projects/financy": "/tools/financy",
  "/projects/air-quality-sensor": "/tools/air-quality-sensor",
  "/projects/toread-today": "/tools/toread-today",
  "/projects/todoapp-caldav": "/tools/caldav-tasks-web",
  "/projects/caldav-mcp": "/tools/caldav-mcp",
  "/projects/zond": "/tools/zond",
  "/projects/rostok": "/tools/rostok",
  "/projects/template": "/tools/template",
  "/projects/mig": "/tools/mig",
  // #231: homelab was reborn as rostok.
  "/projects/homelab": "/tools/rostok",
};

/** Every old `/work/<slug>` URL of an own project that moved to /tools (#273). */
const EXPECTED_WORK_REDIRECTS: Record<string, string> = {
  "/work/financy": "/tools/financy",
  "/work/air-quality-sensor": "/tools/air-quality-sensor",
  "/work/toread-today": "/tools/toread-today",
  "/work/todoapp-caldav": "/tools/caldav-tasks-web",
  "/work/caldav-mcp": "/tools/caldav-mcp",
  "/work/zond": "/tools/zond",
  "/work/rostok": "/tools/rostok",
  "/work/template": "/tools/template",
  "/work/mig": "/tools/mig",
};

Deno.test("every old /work URL of a moved own project redirects to its tool page in one hop, with and without a trailing slash", () => {
  for (const [from, to] of Object.entries(EXPECTED_WORK_REDIRECTS)) {
    assertEquals(redirectTarget(from), to, from);
    assertEquals(redirectTarget(`${from}/`), to, `${from}/`);
  }
});

Deno.test("the table holds no /work URL beyond the moved own projects", () => {
  const extra = [...redirectTable.keys()]
    .filter((k) => k.startsWith("/work/"))
    .map((k) => k.replace(/(.)\/$/, "$1"))
    .filter((k) => !(k in EXPECTED_WORK_REDIRECTS));
  assertEquals(extra, []);
});

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

Deno.test("every redirect lands on a page that exists", () => {
  for (const to of new Set(redirectTable.values())) {
    if (to === "/work" || to.startsWith("/blog/")) continue;
    const [, section, slug] = to.split("/");
    const found = section === "tools" ? findTool(slug) : findWorkProject(slug);
    assert(found, `${to} has no page`);
  }
});

Deno.test("a moved slug redirects from /work and /projects to its new tool slug, a client slug stays under /work", () => {
  const table = buildRedirectTable({
    workSlugs: ["client-app"],
    movedSlugs: { "old-name": "new-name" },
  });
  for (const from of ["/projects/old-name", "/work/old-name"]) {
    assertEquals(redirectTarget(from, table), "/tools/new-name", from);
    assertEquals(redirectTarget(`${from}/`, table), "/tools/new-name", from);
  }
  assertEquals(
    redirectTarget("/projects/client-app", table),
    "/work/client-app",
  );
  assertEquals(redirectTarget("/work/client-app", table), undefined);
});

Deno.test("an unknown /projects slug is not redirected, so it answers 404", () => {
  assertEquals(redirectTarget("/projects/no-such-project"), undefined);
  assertEquals(redirectTarget("/projects/no-such-project/"), undefined);
});

Deno.test("redirects a trailing-slash post URL to the slash-free form", () => {
  assertEquals(redirectTarget("/blog/ship-it-today/"), "/blog/ship-it-today");
});

Deno.test("redirects a trailing-slash work URL to the slash-free form", () => {
  assertEquals(redirectTarget("/work/smartlite/"), "/work/smartlite");
});

Deno.test("redirects a trailing-slash tool URL to the slash-free form", () => {
  assertEquals(redirectTarget("/tools/mig/"), "/tools/mig");
  assertEquals(redirectTarget("/tools/no-such-tool/"), "/tools/no-such-tool");
  assertEquals(redirectTarget("/tools"), undefined);
  assertEquals(redirectTarget("/tools/mig"), undefined);
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
  assertEquals(redirectTarget("/work/smartlite"), undefined);
  assertEquals(redirectTarget("/work"), undefined);
});

Deno.test("leaves unrelated trailing-slash paths alone", () => {
  assertEquals(redirectTarget("/catalog/"), undefined);
  assertEquals(redirectTarget("/blog/"), undefined);
});

Deno.test("the retired homelab slug's target is a real tool and homelab itself is gone", () => {
  assert(findTool("rostok"), "no rostok tool");
  assert(!findTool("homelab"), "homelab is still a tool");
  assert(
    !projects.freelance.some((p) => p.slug === "homelab"),
    "homelab is still a project",
  );
});
