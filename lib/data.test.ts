import { assert } from "jsr:@std/assert@^1.0.0";
import { blogArticles, homeBlogSlugs } from "./data.ts";

Deno.test("every hand-picked home slug resolves to an article", () => {
  for (const slug of homeBlogSlugs) {
    const article = blogArticles.find((a) => a.slug === slug);
    assert(article, `homeBlogSlugs: no article with slug "${slug}"`);
  }
});
