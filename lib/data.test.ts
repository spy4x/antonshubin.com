import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  archiveProjects,
  blogArticles,
  formatPeriod,
  highlightProjects,
  highlightSlugs,
  projects,
} from "./data.ts";

Deno.test("the highlights are the six projects #232 names, in its order", () => {
  assertEquals(highlightProjects().map((p) => p.slug), [
    "smartlite",
    "foodrazor",
    "corecircle",
    "roley",
    "connectful",
    "truth-or-dare",
  ]);
});

Deno.test("every client project is a highlight or in the archive, never both", () => {
  const archive = archiveProjects().map((p) => p.slug);
  assert(archive.length > 0, "the archive is empty");
  for (const p of projects.freelance) {
    const inHighlights = highlightSlugs.includes(p.slug!);
    const inArchive = archive.includes(p.slug);
    assert(
      inHighlights !== inArchive,
      `${p.slug}: highlight ${inHighlights}, archive ${inArchive}`,
    );
  }
  for (const p of projects.my) {
    assert(!archive.includes(p.slug), `tool ${p.slug} is in the archive`);
  }
});

Deno.test("the archive is newest first, and a same-year tie keeps the data order", () => {
  assertEquals(archiveProjects().map((p) => p.slug), [
    "sogroya",
    "gopingu",
    "code-review",
    "microwork",
    "calltrack",
    "sajari",
  ]);
});

Deno.test("Microwork's tags are AngularJS, MongoDB and AWS EC2, with no Firebase", () => {
  const microwork = projects.freelance.find((p) => p.slug === "microwork");
  assert(microwork?.tags, "microwork has no tags");
  for (const tag of ["AngularJS", "MongoDB", "AWS EC2"]) {
    assert(microwork.tags.includes(tag), `microwork lacks tag ${tag}`);
  }
  for (const tag of ["Firebase", "Firestore"]) {
    assert(!microwork.tags.includes(tag), `microwork still tagged ${tag}`);
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
