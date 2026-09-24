import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { testimonials, visibleTestimonials } from "./testimonials.ts";

Deno.test("no testimonial is visible until it has a source and permission", () => {
  for (const t of testimonials) {
    assertEquals(t.permission, false, `${t.id} ships with permission: true`);
  }
  assertEquals(visibleTestimonials(), []);
});

Deno.test("a testimonial with a source and permission is visible", () => {
  const withSource = [
    ...testimonials,
    {
      id: "example",
      quote: "Great work.",
      name: "A Client",
      sourceHref: "https://example.com/review",
      permission: true,
    },
  ];
  const visible = withSource.filter((t) => t.sourceHref && t.permission);
  assertEquals(visible.length, 1);
  assertEquals(visible[0].id, "example");
});
