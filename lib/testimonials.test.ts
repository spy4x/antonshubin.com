import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  type Testimonial,
  testimonials,
  visibleTestimonials,
} from "./testimonials.ts";

const base: Omit<Testimonial, "sourceHref" | "permission"> = {
  id: "example",
  quote: "Great work.",
  name: "A Client",
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

Deno.test("the real testimonial list ships with nothing visible yet", () => {
  // Not a pin on `permission` staying false forever — once Anton approves a
  // quote (sourceHref + permission: true), this goes red on purpose, and the
  // fix is to update this assertion, not lib/testimonials.ts.
  assertEquals(visibleTestimonials(testimonials), []);
});
