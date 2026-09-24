import { assert } from "jsr:@std/assert@^1.0.0";
import { blogArticles, featuredClientSlugs, projects } from "./data.ts";

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
