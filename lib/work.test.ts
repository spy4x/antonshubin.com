import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Project } from "./data.ts";
import { repeatClientsLine } from "./testimonials.ts";
import {
  archiveFrame,
  clientWork,
  formatYearSpan,
  projectsForCatalog,
  projectStatus,
  repeatClientsSegments,
  workDescription,
  yearSpan,
} from "./work.ts";

const project = (extra: Partial<Project>): Project => ({
  title: "X",
  description: "",
  ...extra,
});

Deno.test("projectStatus reads archived, offline, live, and nothing for a document link", () => {
  assertEquals(projectStatus(project({ archived: true })), "archived");
  assertEquals(
    projectStatus(
      project({ externalURL: "https://a.example", externalURLDead: true }),
    ),
    "offline",
  );
  assertEquals(
    projectStatus(project({ externalURL: "https://a.example" })),
    "live",
  );
  assertEquals(
    projectStatus(
      project({ externalURL: "https://a.example", externalURLLabel: "Report" }),
    ),
    null,
  );
  assertEquals(projectStatus(project({})), null);
});

Deno.test("yearSpan runs from the first year to the last, or to now while one is ongoing", () => {
  const old = project({ period: { from: 2014 } });
  const mid = project({ period: { from: 2018, to: 2019 } });
  assertEquals(formatYearSpan(yearSpan([mid, old])), "2014–2019");
  assertEquals(
    formatYearSpan(
      yearSpan([old, project({ period: { from: 2024, ongoing: true } })]),
    ),
    "2014–now",
  );
  assertEquals(formatYearSpan(yearSpan([old])), "2014");
});

Deno.test("the /work description fits 160 characters by naming fewer highlights, never by cutting a word", () => {
  const work = clientWork();
  const text = workDescription("Role", work);
  assert(text.length <= 160, `${text.length}`);
  assert(text.endsWith("what I built, for whom, and what happened."), text);
  assert(text.includes(work.highlights[0].title), text);
  const tight = workDescription("Role", work, 110);
  assert(tight.length <= 110, tight);
  assert(tight.includes(`including ${work.highlights[0].title}:`), tight);
});

Deno.test("the archive sentence counts offline products and agrees in number", () => {
  const live = { project: project({ externalURL: "https://a.example" }) };
  const dead = {
    project: project({
      externalURL: "https://b.example",
      externalURLDead: true,
    }),
  };
  assertEquals(archiveFrame([live]), "Earlier client work, newest first.");
  assertEquals(
    archiveFrame([live, dead]),
    "Earlier client work, newest first. 1 of these 2 projects is no longer online.",
  );
  assertEquals(
    archiveFrame([dead, dead, live]),
    "Earlier client work, newest first. 2 of these 3 projects are no longer online.",
  );
});

Deno.test("the repeat-clients segments join back into the line and mark each named project", () => {
  const segments = repeatClientsSegments();
  assertEquals(segments.map((s) => s.text).join(""), repeatClientsLine());
  assertEquals(
    segments.filter((s) => s.slug).map((s) => [s.text, s.slug]),
    [
      ["FoodRazor", "foodrazor"],
      ["Roley", "roley"],
      ["Microwork", "microwork"],
      ["Connectful", "connectful"],
      ["Corecircle", "corecircle"],
    ],
  );
});

Deno.test("projectsForCatalog lists the client projects sold under an item, highlights first", () => {
  assertEquals(
    projectsForCatalog("zero-to-production-saas-mvp").map((p) => p.slug),
    ["smartlite", "roley", "sogroya"],
  );
  assertEquals(
    projectsForCatalog("codebase-health-audit").map((p) => p.slug),
    ["code-review"],
  );
  assertEquals(projectsForCatalog("cto-advisory-retainer").length, 3);
  assertEquals(projectsForCatalog("cto-advisory-retainer", 2).length, 2);
});

Deno.test("projectsForCatalog gives no project for the strategy session and throws on a typo", () => {
  assertEquals(projectsForCatalog("strategy-call"), []);
  let threw = false;
  try {
    projectsForCatalog("strategy-cal");
  } catch {
    threw = true;
  }
  assert(threw, "a mistyped slug must fail, not return an empty list");
});
