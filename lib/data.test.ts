import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  blogArticles,
  featuredClientSlugs,
  formatPeriod,
  projects,
} from "./data.ts";

Deno.test("every featured client slug resolves to a freelance project", () => {
  assert(
    featuredClientSlugs.length > 0,
    "featuredClientSlugs is empty — the loop below would run zero times and pass vacuously",
  );
  for (const slug of featuredClientSlugs) {
    const project = projects.freelance.find((p) => p.slug === slug);
    assert(
      project,
      `featuredClientSlugs: no freelance project with slug "${slug}"`,
    );
  }
});

Deno.test("every blog article slug is unique", () => {
  const slugs = blogArticles.map((a) => a.slug);
  assert(
    new Set(slugs).size === slugs.length,
    "blogArticles has duplicate slugs",
  );
});

Deno.test("every client project has a period", () => {
  assert(projects.freelance.length > 0, "no client projects");
  for (const p of projects.freelance) {
    assert(p.period, `${p.slug} has no period`);
    assert(
      Number.isInteger(p.period.from),
      `${p.slug}: period.from is not a year`,
    );
    if (p.period.to !== undefined) {
      assert(
        p.period.to >= p.period.from,
        `${p.slug}: period ends before it starts`,
      );
    }
  }
});

Deno.test("a period renders as one year, a range with an en dash, or a year to now", () => {
  assertEquals(formatPeriod({ from: 2021 }), "2021");
  assertEquals(formatPeriod({ from: 2021, to: 2021 }), "2021");
  assertEquals(formatPeriod({ from: 2018, to: 2019 }), "2018\u20132019");
  assertEquals(formatPeriod({ from: 2024, ongoing: true }), "2024\u2013now");
});
