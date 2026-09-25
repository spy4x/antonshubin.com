import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  EXCERPT_JOIN,
  homeTestimonialIds,
  projectTestimonials,
  repeatClients,
  repeatClientsLine,
  type Testimonial,
  testimonial,
  testimonialProject,
  testimonials,
  visibleTestimonials,
} from "./testimonials.ts";

const base: Omit<Testimonial, "sourceHref" | "permission"> = {
  id: "example-1",
  projectSlug: "roley",
  contract: 1,
  quote: "Great work.",
  excerpt: "Great work.",
};

Deno.test("a testimonial with a source and permission is visible", () => {
  const t: Testimonial = {
    ...base,
    sourceHref: "https://example.com/review",
    permission: true,
  };
  assertEquals(visibleTestimonials([t]), [t]);
});

Deno.test("a testimonial with permission but no source is not visible", () => {
  const t: Testimonial = { ...base, permission: true };
  assertEquals(visibleTestimonials([t]), []);
});

Deno.test("a testimonial with a source but no permission is not visible", () => {
  const t: Testimonial = {
    ...base,
    sourceHref: "https://example.com/review",
    permission: false,
  };
  assertEquals(visibleTestimonials([t]), []);
});

Deno.test("every testimonial's projectSlug resolves to a client project", () => {
  assert(
    testimonials.length > 0,
    "no testimonials — the loop would pass vacuously",
  );
  for (const t of testimonials) {
    assertEquals(testimonialProject(t).slug, t.projectSlug, t.id);
  }
});

Deno.test("a testimonial naming an unknown project throws instead of rendering", () => {
  assertThrows(
    () =>
      testimonialProject({
        ...base,
        projectSlug: "rolley",
        permission: true,
      }),
    Error,
    'names no client project "rolley"',
  );
});

Deno.test("a typo'd testimonial id throws instead of returning undefined", () => {
  assertThrows(() => testimonial("roley-9"), Error, 'no testimonial "roley-9"');
});

Deno.test("every excerpt is made only of verbatim pieces of its own quote, in order", () => {
  for (const t of testimonials) {
    const pieces = t.excerpt.split(EXCERPT_JOIN);
    let from = 0;
    for (const piece of pieces) {
      assert(piece.trim().length > 0, `${t.id}: empty excerpt piece`);
      const at = t.quote.indexOf(piece, from);
      assert(
        at >= 0,
        `${t.id}: excerpt piece is not a verbatim, in-order part of its quote: "${piece}"`,
      );
      from = at + piece.length;
    }
  }
});

Deno.test("the client's own spelling stays in the quotes", () => {
  // Never correct a client's review; cut around a misspelling in the excerpt instead.
  const pinned: Record<string, string[]> = {
    "calltrack-1": ["gratest", "terxt", "communcation"],
    "microwork-2": ["he has he taken"],
    "foodrazor-2": ["work with him the future"],
  };
  for (const [id, words] of Object.entries(pinned)) {
    for (const word of words) {
      assert(testimonial(id).quote.includes(word), `${id} lost "${word}"`);
    }
  }
});

Deno.test("each review is one contract, and ids follow the project and contract", () => {
  const ids = testimonials.map((t) => t.id);
  assertEquals(new Set(ids).size, ids.length, "duplicate testimonial ids");
  for (const t of testimonials) {
    assertEquals(t.id, `${t.projectSlug}-${t.contract}`);
  }
});

Deno.test("every real testimonial links its source and is cleared for the site", () => {
  assertEquals(visibleTestimonials(testimonials), testimonials);
});

Deno.test("the home page shows Roley contract 1, Corecircle and Connectful contract 1", () => {
  assertEquals(homeTestimonialIds, ["roley-1", "corecircle-1", "connectful-1"]);
  for (const id of homeTestimonialIds) testimonial(id);
});

Deno.test("microwork's four reviews come back first contract first", () => {
  assertEquals(
    projectTestimonials("microwork").map((t) => t.contract),
    [1, 2, 3, 4],
  );
});

Deno.test("four of the eight reviewing clients hired Anton again, counted from the reviews", () => {
  const r = repeatClients();
  assertEquals(r.reviewed, 8);
  assertEquals(r.rehiredOnSameProject.map((p) => p.slug), [
    "foodrazor",
    "roley",
    "microwork",
  ]);
  assertEquals(r.followOn.map((x) => [x.from.slug, x.to.slug]), [
    ["connectful", "corecircle"],
  ]);
  assertEquals(
    repeatClientsLine(r),
    "Four of the eight clients who reviewed me hired me again (FoodRazor, Roley, Microwork), and Connectful's founder hired me again for her next product, Corecircle.",
  );
});

Deno.test("a project with one reviewed contract is not a repeat client", () => {
  const one = { ...base, sourceHref: "https://example.com", permission: true };
  const r = repeatClients([one], []);
  assertEquals(r.reviewed, 1);
  assertEquals(r.rehiredOnSameProject, []);
  const two = { ...one, id: "example-2", contract: 2 };
  assertEquals(
    repeatClients([one, two], []).rehiredOnSameProject.map((p) => p.slug),
    ["roley"],
  );
});
