import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { TestimonialCard } from "./TestimonialCard.tsx";
import type { Testimonial } from "../lib/testimonials.ts";

const withSource: Testimonial = {
  id: "example",
  quote: "Great work.",
  name: "A Client",
  sourceHref: "https://example.com/review",
  permission: true,
};

Deno.test("a testimonial with a sourceHref renders a link to it", () => {
  const html = render(<TestimonialCard t={withSource} />);
  assert(
    html.includes(`href="${withSource.sourceHref}"`),
    `rendered card has no link to sourceHref:\n${html}`,
  );
});

Deno.test("a testimonial with no sourceHref renders no source link", () => {
  const { sourceHref: _drop, ...rest } = withSource;
  const html = render(<TestimonialCard t={rest} />);
  assert(
    !html.includes("Source"),
    `rendered card shows a source link it shouldn't:\n${html}`,
  );
});
